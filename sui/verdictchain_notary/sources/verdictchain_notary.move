/// Mainnet notary module for VerdictChain evidence seals.
module verdictchain_notary::verdictchain_notary;

use sui::event;
use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};

public struct EvidenceSeal has key, store {
    id: UID,
    proof_hash: vector<u8>,
    evidence_id: vector<u8>,
    case_id: vector<u8>,
    sealed_by: address,
}

public struct EvidenceSealed has copy, drop {
    seal_id: ID,
    proof_hash: vector<u8>,
    evidence_id: vector<u8>,
    case_id: vector<u8>,
    sealed_by: address,
}

entry fun seal_evidence(
    proof_hash: vector<u8>,
    evidence_id: vector<u8>,
    case_id: vector<u8>,
    ctx: &mut TxContext,
) {
    let sealed_by = tx_context::sender(ctx);
    let seal = EvidenceSeal {
        id: object::new(ctx),
        proof_hash,
        evidence_id,
        case_id,
        sealed_by,
    };
    let seal_id = object::uid_to_inner(&seal.id);

    event::emit(EvidenceSealed {
        seal_id,
        proof_hash: seal.proof_hash,
        evidence_id: seal.evidence_id,
        case_id: seal.case_id,
        sealed_by,
    });

    transfer::public_transfer(seal, sealed_by);
}
