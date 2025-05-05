from unittest import mock
from api.PclusterApiHandler import login, get_base_url, create_url_map

class MockRequest:
    cookies = {'int_value': 100}
    args = {'version': '3.12.0'}
    json = {'username': 'user@email.com'}


@mock.patch("api.PclusterApiHandler.requests.post")
def test_on_successful_login_auth_cookies_are_set(mock_post, client):
    with client as flaskClient:
        response_dict = {
            "access_token": "testAccessToken",
            "id_token": "testIdToken",
            "refresh_token": "testRefreshToken"
        }
        mock_post.return_value.json.return_value = response_dict
        resp = flaskClient.get("/login", query_string="code=testCode")
        cookie_list = resp.headers.getlist('Set-Cookie')
        assert "accessToken=testAccessToken; Secure; HttpOnly; Path=/; SameSite=Lax" in cookie_list
        assert "idToken=testIdToken; Secure; HttpOnly; Path=/; SameSite=Lax" in cookie_list
        assert "refreshToken=testRefreshToken; Secure; HttpOnly; Path=/; SameSite=Lax" in cookie_list


def test_login_with_no_access_token_returns_401(mocker, app):
    with app.test_request_context('/login', query_string='code=testCode'):
        mock_abort = mocker.patch('api.PclusterApiHandler.abort')
        mock_post = mocker.patch('api.PclusterApiHandler.requests.post')
        mock_post.return_value.json.return_value = {'access_token': None}

        login()

        mock_abort.assert_called_once_with(401)

def test_get_base_url(monkeypatch):
    monkeypatch.setattr('api.PclusterApiHandler.API_VERSION', ['3.12.0', '3.11.0'])
    monkeypatch.setattr('api.PclusterApiHandler.API_BASE_URL', '3.12.0=https://example.com,3.11.0=https://example1.com,')
    monkeypatch.setattr('api.PclusterApiHandler.API_BASE_URL_MAPPING', {'3.12.0': 'https://example.com', '3.11.0': 'https://example1.com'})

    assert 'https://example.com' == get_base_url(MockRequest())

def test_create_url_map():
    assert {'3.12.0': 'https://example.com', '3.11.0': 'https://example1.com'} == create_url_map('3.12.0=https://example.com,3.11.0=https://example1.com,')

