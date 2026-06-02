# Deploy VerdictChain Notary To Sui Devnet

This package is deployed on Sui devnet.

```text
Package ID: 0x5f8a69e8004ee5aa943dccaf5b0fa336dfffcf5b320aa13b081b772ecaf5b823
Publish tx:  HKWDw2HpobpvmGnh3kwc4SsQeVFkaaqnrXgp4RBK1yq3
Smoke tx:    Di8DcxChXAMvArMRZc4xPagYnn61kHeGBv4Ld5w7tq6n
Backend tx:  F5ngh2HPpsgNzKoxS3GgPjG3ja5RvdReW3yZJwsaQ4MS
```

Sui treats devnet as an ephemeral network, so use `test-publish`:

```bash
sui client switch --env devnet
sui client faucet
sui client test-publish sui/verdictchain_notary \
  --build-env testnet \
  --skip-dependency-verification \
  --gas-budget 100000000 \
  --json
```

Backend env:

```bash
SUI_NETWORK=devnet
SUI_SENDER_ADDRESS=0x84978ca85b3effd9712157238aa262126392b782897917d7e8475376dcfcb7a2
SUI_NOTARY_PACKAGE_ID=0x5f8a69e8004ee5aa943dccaf5b0fa336dfffcf5b320aa13b081b772ecaf5b823
SUI_NOTARY_MODULE=verdictchain_notary
SUI_NOTARY_FUNCTION=seal_evidence
SUI_CLI_ENABLED=true
SUI_CLI_PATH=sui
SUI_GAS_BUDGET=10000000
TATUM_RPC_URL=https://fullnode.devnet.sui.io:443
```
