"""Authentication endpoints for Sui wallet sessions and current user lookup."""

from __future__ import annotations

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.asymmetric import ec, utils
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password
from app.models.models import WalletChallenge
from app.repositories.repository import user_repo, wallet_challenge_repo
from app.schemas.schemas import (
    TokenResponse,
    UserResponse,
    WalletChallengeRequest,
    WalletChallengeResponse,
    WalletLoginRequest,
)
from app.api.deps import get_current_user
from app.utils.audit import log_action

router = APIRouter(prefix="/auth", tags=["Authentication"])

_SUI_ED25519_SCHEME = 0
_SUI_SECP256K1_SCHEME = 1
_SUI_SECP256R1_SCHEME = 2
_SUI_PERSONAL_MESSAGE_INTENT = bytes([3, 0, 0])
_SUI_SIGNATURE_SIZE = 64
_SUI_PUBLIC_KEY_SIZES = {
    _SUI_ED25519_SCHEME: 32,
    _SUI_SECP256K1_SCHEME: 33,
    _SUI_SECP256R1_SCHEME: 33,
}
_WALLET_CHALLENGE_TTL_MINUTES = 10


def _normalise_wallet(address: str) -> str:
    return address.lower()


def _uleb128(value: int) -> bytes:
    out = bytearray()
    while True:
        byte = value & 0x7F
        value >>= 7
        if value:
            out.append(byte | 0x80)
        else:
            out.append(byte)
            return bytes(out)


def _personal_message_digest(message: bytes) -> bytes:
    bcs_message = _uleb128(len(message)) + message
    return hashlib.blake2b(
        _SUI_PERSONAL_MESSAGE_INTENT + bcs_message,
        digest_size=32,
    ).digest()


def _address_from_public_key(signature_scheme: int, public_key: bytes) -> str:
    digest = hashlib.blake2b(
        bytes([signature_scheme]) + public_key,
        digest_size=32,
    ).hexdigest()
    return f"0x{digest}"


def _verify_ecdsa_digest(
    *,
    signature: bytes,
    digest: bytes,
    public_key: bytes,
    curve: ec.EllipticCurve,
) -> bool:
    try:
        der_signature = utils.encode_dss_signature(
            int.from_bytes(signature[:32], "big"),
            int.from_bytes(signature[32:], "big"),
        )
        ec_public_key = ec.EllipticCurvePublicKey.from_encoded_point(curve, public_key)
        ec_public_key.verify(
            der_signature,
            digest,
            ec.ECDSA(hashes.SHA256()),
        )
        return True
    except (InvalidSignature, ValueError):
        return False


def _verify_sui_personal_message(
    *,
    wallet_address: str,
    message: str,
    message_bytes_b64: str,
    signature_b64: str,
) -> bool:
    try:
        message_bytes = base64.b64decode(message_bytes_b64, validate=True)
        signature_payload = base64.b64decode(signature_b64, validate=True)
    except Exception:
        return False

    if message_bytes != message.encode("utf-8"):
        return False

    signature_scheme = signature_payload[0]
    if signature_scheme not in _SUI_PUBLIC_KEY_SIZES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Ed25519, Secp256k1, and Secp256r1 Sui wallet signatures are supported",
        )

    public_key_size = _SUI_PUBLIC_KEY_SIZES[signature_scheme]
    expected_payload_size = 1 + _SUI_SIGNATURE_SIZE + public_key_size
    if len(signature_payload) != expected_payload_size:
        return False

    signature = signature_payload[1:65]
    public_key = signature_payload[65:]
    recovered_address = _address_from_public_key(signature_scheme, public_key)
    if recovered_address != _normalise_wallet(wallet_address):
        return False

    digest = _personal_message_digest(message_bytes)
    try:
        if signature_scheme == _SUI_ED25519_SCHEME:
            Ed25519PublicKey.from_public_bytes(public_key).verify(signature, digest)
            return True
        if signature_scheme == _SUI_SECP256K1_SCHEME:
            return _verify_ecdsa_digest(
                signature=signature,
                digest=digest,
                public_key=public_key,
                curve=ec.SECP256K1(),
            )
        if signature_scheme == _SUI_SECP256R1_SCHEME:
            return _verify_ecdsa_digest(
                signature=signature,
                digest=digest,
                public_key=public_key,
                curve=ec.SECP256R1(),
            )
    except (InvalidSignature, ValueError):
        return False

    return False


async def _get_wallet_challenge(
    db: AsyncSession,
    wallet_address: str,
    nonce: str,
) -> WalletChallenge | None:
    result = await db.execute(
        select(WalletChallenge)
        .where(WalletChallenge.wallet_address == wallet_address)
        .where(WalletChallenge.nonce == nonce)
        .where(WalletChallenge.consumed_at.is_(None))
    )
    return result.scalars().first()


@router.post("/wallet/challenge", response_model=WalletChallengeResponse)
async def create_wallet_challenge(
    body: WalletChallengeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a one-time Sui personal-message challenge for wallet login."""
    wallet_address = _normalise_wallet(body.wallet_address)
    nonce = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=_WALLET_CHALLENGE_TTL_MINUTES)
    message = (
        "VerdictChain wallet login\n"
        f"Wallet: {wallet_address}\n"
        f"Nonce: {nonce}\n"
        f"Expires: {expires_at.isoformat()}"
    )

    challenge = await wallet_challenge_repo.create(db, {
        "wallet_address": wallet_address,
        "nonce": nonce,
        "message": message,
        "expires_at": expires_at,
    })

    return WalletChallengeResponse(
        wallet_address=wallet_address,
        nonce=challenge.nonce,
        message=challenge.message,
        expires_at=challenge.expires_at,
    )


@router.post("/wallet/login", response_model=TokenResponse)
async def login_with_wallet(
    body: WalletLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify a signed Sui wallet challenge and return a JWT session."""
    wallet_address = _normalise_wallet(body.wallet_address)
    challenge = await _get_wallet_challenge(db, wallet_address, body.nonce)
    now = datetime.now(timezone.utc)
    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wallet challenge not found or already used",
        )

    expires_at = challenge.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wallet challenge expired",
        )

    if not _verify_sui_personal_message(
        wallet_address=wallet_address,
        message=challenge.message,
        message_bytes_b64=body.message_bytes,
        signature_b64=body.signature,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Sui wallet signature",
        )

    user = await user_repo.get_by_wallet(db, wallet_address)
    if user is None:
        user = await user_repo.create(db, {
            "email": f"{wallet_address[2:18]}@wallet.verdictchain.local",
            "name": f"Sui Wallet {wallet_address[:6]}...{wallet_address[-4:]}",
            "hashed_password": hash_password(secrets.token_urlsafe(32)),
            "wallet_address": wallet_address,
        })
        await log_action(
            db,
            action="wallet_register",
            entity_type="user",
            entity_id=user.id,
            user_id=user.id,
        )

    challenge.consumed_at = now
    token = create_access_token(data={"sub": str(user.id)})

    await log_action(
        db,
        action="wallet_login",
        entity_type="user",
        entity_id=user.id,
        user_id=user.id,
    )

    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user
