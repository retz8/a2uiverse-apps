"""Shop B's sign-in: a key in a request header (task-12.10 decisions 2 and 3).

The mock store stands for a third-party app that signs in with an API key rather than
OAuth: its card declares an `apiKey` scheme, the person enters their key on the sign-in
page A2UIVerse serves, and a request without a valid key is answered 401. The demo key is
in the README.
"""

from a2ui_agent_kit.sign_in import ApiKeySignIn, FakeAccount

HEADER = "X-Northlight-Key"

DEMO_KEY = "northlight-demo-key-4f7c2a"

SIGN_IN = ApiKeySignIn(
    header=HEADER,
    description="Your Northlight key. You'll find it on your Northlight account page.",
    keys={DEMO_KEY: FakeAccount("demo-shopper", {"name": "Demo shopper"})},
)
