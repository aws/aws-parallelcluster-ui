import base64
import hashlib
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from api import PclusterApiHandler
from api.PclusterApiHandler import jwt_decode

AUDIENCE = 'client-id'
ACCESS_TOKEN = 'access-token'


@pytest.fixture(scope='module')
def signing_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope='module')
def other_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(autouse=True)
def mock_jwks_client(mocker, signing_key):
    jwks_client = mocker.Mock()
    jwks_client.get_signing_key_from_jwt.return_value = mocker.Mock(key=signing_key.public_key())
    mocker.patch.object(PclusterApiHandler.jwt, 'PyJWKClient', return_value=jwks_client)
    return jwks_client


def _at_hash(access_token):
    digest = hashlib.sha256(access_token.encode('ascii')).digest()
    return base64.urlsafe_b64encode(digest[:16]).decode('ascii').rstrip('=')


def _token(key, algorithm='RS256', **claims):
    payload = {'sub': 'user', 'exp': int(time.time()) + 300, **claims}
    return jwt.encode(payload, key, algorithm=algorithm, headers={'kid': 'kid'})


def test_jwt_decode_valid_access_token(signing_key, mock_jwks_client):
    token = _token(signing_key, username='user')

    claims = jwt_decode(token)

    assert claims['username'] == 'user'
    mock_jwks_client.get_signing_key_from_jwt.assert_called_once_with(token)


def test_jwt_decode_expired_token_raises_expired_signature_error(signing_key):
    token = _token(signing_key, exp=int(time.time()) - 10)

    with pytest.raises(jwt.ExpiredSignatureError):
        jwt_decode(token)


def test_jwt_decode_token_signed_with_other_key_is_rejected(other_key):
    token = _token(other_key)

    with pytest.raises(jwt.InvalidSignatureError):
        jwt_decode(token)


def test_jwt_decode_token_with_non_rs256_algorithm_is_rejected():
    token = _token('a-shared-secret-of-at-least-32-bytes', algorithm='HS256')

    with pytest.raises(jwt.InvalidAlgorithmError):
        jwt_decode(token)


def test_jwt_decode_id_token_with_expected_audience(signing_key):
    token = _token(signing_key, aud=AUDIENCE, at_hash=_at_hash(ACCESS_TOKEN))

    claims = jwt_decode(token, audience=AUDIENCE, access_token=ACCESS_TOKEN)

    assert claims['aud'] == AUDIENCE


def test_jwt_decode_id_token_with_unexpected_audience_is_rejected(signing_key):
    token = _token(signing_key, aud='other-client-id')

    with pytest.raises(jwt.InvalidAudienceError):
        jwt_decode(token, audience=AUDIENCE)


def test_jwt_decode_token_with_audience_when_none_expected_is_rejected(signing_key):
    token = _token(signing_key, aud=AUDIENCE)

    with pytest.raises(jwt.InvalidAudienceError):
        jwt_decode(token)


def test_jwt_decode_id_token_with_mismatching_at_hash_is_rejected(signing_key):
    token = _token(signing_key, aud=AUDIENCE, at_hash=_at_hash('other-access-token'))

    with pytest.raises(jwt.InvalidTokenError, match='at_hash claim does not match access_token'):
        jwt_decode(token, audience=AUDIENCE, access_token=ACCESS_TOKEN)


def test_jwt_decode_id_token_with_at_hash_and_no_access_token_is_rejected(signing_key):
    token = _token(signing_key, aud=AUDIENCE, at_hash=_at_hash(ACCESS_TOKEN))

    with pytest.raises(jwt.InvalidTokenError, match='at_hash claim does not match access_token'):
        jwt_decode(token, audience=AUDIENCE)
