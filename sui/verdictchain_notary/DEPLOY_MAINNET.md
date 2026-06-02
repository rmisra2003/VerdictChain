# Deploy VerdictChain Notary To Sui Mainnet

This package has been built and dry-run successfully with the Sui CLI.
The current working deployment is on devnet; see `DEPLOY_DEVNET.md`.

Current module/function expected by the backend:

- Package: set after publish as `SUI_NOTARY_PACKAGE_ID`
- Module: `verdictchain_notary`
- Function: `seal_evidence`

## Prerequisites

The publishing address must own mainnet SUI for gas.

```bash
sui client switch --env mainnet
sui client active-address
sui client gas
```

## Publish

```bash
sui client publish sui/verdictchain_notary --gas-budget 100000000 --json
```

After publish, copy the immutable package object ID into:

```bash
SUI_NOTARY_PACKAGE_ID=<published-package-id>
SUI_SENDER_ADDRESS=<publishing-address>
SUI_NETWORK=mainnet
```

Restart the backend after updating the environment.
