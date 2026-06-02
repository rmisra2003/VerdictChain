"""File processing and validation utilities."""

from __future__ import annotations

import hashlib
import os
import re
import unicodedata

from app.core.config import settings

# Maximum filename length (excluding extension) after sanitisation.
_MAX_FILENAME_LENGTH: int = 200


def calculate_sha256(file_data: bytes) -> str:
    """Return the hex-encoded SHA-256 digest of *file_data*."""
    return hashlib.sha256(file_data).hexdigest()


def validate_file_type(content_type: str) -> bool:
    """Check whether *content_type* is in the allow-list defined in settings.

    Comparison is case-insensitive and strips surrounding whitespace.
    """
    normalised = content_type.strip().lower()
    return normalised in [m.lower() for m in settings.allowed_mime_list]


def validate_file_size(size: int) -> bool:
    """Return ``True`` if *size* (in bytes) is within the configured limit."""
    return 0 < size <= settings.max_file_size_bytes


def sanitize_filename(filename: str) -> str:
    """Remove dangerous characters and normalise a user-supplied filename.

    Steps:
    1. Unicode NFC normalisation.
    2. Strip directory / path-traversal components.
    3. Replace any character that is not alphanumeric, hyphen, underscore
       or period with an underscore.
    4. Collapse consecutive underscores.
    5. Truncate the stem to ``_MAX_FILENAME_LENGTH`` characters while
       preserving the extension.
    """
    # Normalise unicode
    filename = unicodedata.normalize("NFC", filename)

    # Take only the basename (remove path traversal)
    filename = os.path.basename(filename)

    # Split into stem and extension
    stem, ext = os.path.splitext(filename)

    # Replace unsafe characters with underscores
    stem = re.sub(r"[^\w\-.]", "_", stem)

    # Collapse consecutive underscores
    stem = re.sub(r"_+", "_", stem).strip("_")

    # Fallback for empty stems
    if not stem:
        stem = "unnamed"

    # Truncate stem
    stem = stem[:_MAX_FILENAME_LENGTH]

    # Sanitise extension (keep only alphanumeric after the dot)
    ext = ext.lower()
    if ext and not re.match(r"^\.[a-z0-9]+$", ext):
        ext = ""

    return f"{stem}{ext}"


def get_file_extension(filename: str) -> str:
    """Extract the file extension from *filename* (including the leading dot).

    Returns an empty string when no extension is present.

    Example::

        >>> get_file_extension("report.pdf")
        '.pdf'
        >>> get_file_extension("archive.tar.gz")
        '.gz'
    """
    _, ext = os.path.splitext(filename)
    return ext.lower()
