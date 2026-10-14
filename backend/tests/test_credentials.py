from app.core.credentials import FAKE_ACCOUNT_ID, MockIssuer


def test_mock_issuer_produces_realistic_credentials() -> None:
    issuer = MockIssuer()
    credential = issuer.issue(
        requested_role="ECS-ReadOnly",
        duration_minutes=30,
        requested_by="11111111-1111-1111-1111-111111111111",
    )

    assert credential.access_key_id.startswith("ASIA")
    assert len(credential.access_key_id) == 20
    assert len(credential.secret_access_key) == 40
    assert len(credential.session_token) == 200
    assert credential.assumed_role.account_id == FAKE_ACCOUNT_ID
    assert credential.assumed_role.role_name == "ECS-ReadOnly"
    assert (
        credential.assumed_role.role_arn
        == f"arn:aws:iam::{FAKE_ACCOUNT_ID}:role/ECS-ReadOnly"
    )
    assert credential.lease_duration_seconds == 30 * 60
    assert credential.renewable is False


def test_mock_issuer_hashes_are_consistent() -> None:
    issuer = MockIssuer()
    credential = issuer.issue(
        requested_role="DatabaseReader",
        duration_minutes=15,
        requested_by="11111111-1111-1111-1111-111111111111",
    )

    import hashlib

    expected_secret_hash = hashlib.sha256(
        credential.secret_access_key.encode("utf-8")
    ).hexdigest()
    expected_token_hash = hashlib.sha256(
        credential.session_token.encode("utf-8")
    ).hexdigest()

    assert credential.secret_access_key_hash == expected_secret_hash
    assert credential.session_token_hash == expected_token_hash


def test_mock_issuer_produces_different_credentials_each_time() -> None:
    issuer = MockIssuer()
    first = issuer.issue(
        requested_role="ECS-ReadOnly",
        duration_minutes=30,
        requested_by="11111111-1111-1111-1111-111111111111",
    )
    second = issuer.issue(
        requested_role="ECS-ReadOnly",
        duration_minutes=30,
        requested_by="11111111-1111-1111-1111-111111111111",
    )

    assert first.access_key_id != second.access_key_id
    assert first.secret_access_key != second.secret_access_key
    assert first.session_token != second.session_token