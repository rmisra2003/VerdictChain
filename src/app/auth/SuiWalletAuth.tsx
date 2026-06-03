"use client";

import { createDAppKit, DAppKitProvider, useCurrentAccount, useDAppKit, useWalletConnection } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { getJsonRpcFullnodeUrl, SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { KeyRound, Link2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { loginWithSuiWalletSignature, requestSuiWalletChallenge } from "@/lib/api";

type VerdictChainNetwork = "devnet" | "mainnet";

const configuredNetwork: VerdictChainNetwork =
  process.env.NEXT_PUBLIC_SUI_NETWORK === "mainnet" ? "mainnet" : "devnet";

const dAppKit = createDAppKit({
  networks: ["devnet", "mainnet"] as VerdictChainNetwork[],
  defaultNetwork: configuredNetwork,
  createClient: (network) =>
    new SuiJsonRpcClient({
      network,
      url: getJsonRpcFullnodeUrl(network),
    }),
  slushWalletConfig: {
    appName: "VerdictChain",
  },
  storageKey: "verdictchain:sui-wallet",
});

function shortenAddress(address: string) {
  return `${address.slice(0, 10)}...${address.slice(-6)}`;
}

function WalletSessionPanel() {
  const router = useRouter();
  const dappKit = useDAppKit();
  const account = useCurrentAccount();
  const connection = useWalletConnection();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const signInWithWallet = async () => {
    if (!account?.address) {
      setErrorMessage("Connect a Sui wallet before signing in.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const challenge = await requestSuiWalletChallenge(account.address);
      const signed = await dappKit.signPersonalMessage({
        message: new TextEncoder().encode(challenge.message),
      });

      await loginWithSuiWalletSignature({
        wallet_address: account.address,
        nonce: challenge.nonce,
        message_bytes: signed.bytes,
        signature: signed.signature,
      });

      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Wallet login failed.");
    } finally {
      setLoading(false);
    }
  };

  const connectedLabel = account?.address ? shortenAddress(account.address) : "No wallet connected";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border/80 bg-secondary/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Sui {configuredNetwork}
            </p>
            <p className="mt-1 font-mono text-sm text-white truncate">{connectedLabel}</p>
          </div>
        </div>
        <div className="shrink-0 wallet-connect-button">
          <ConnectButton>Connect Wallet</ConnectButton>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border/60 bg-black/25 p-4">
          <div className="flex items-center gap-2 text-white">
            <Link2 className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-bold">Challenge</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            The backend issues a one-time message tied to this wallet address.
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-black/25 p-4">
          <div className="flex items-center gap-2 text-white">
            <KeyRound className="w-4 h-4 text-accent-blue" />
            <span className="text-xs font-bold">Session</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            The signed Sui personal message becomes your workspace JWT.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 p-3 text-xs text-accent-red">
          {errorMessage}
        </div>
      )}

      <Button
        variant="glow"
        className="w-full gap-2"
        type="button"
        loading={loading}
        disabled={connection.status !== "connected" || !account}
        onClick={signInWithWallet}
      >
        <KeyRound className="w-4 h-4" />
        Sign Challenge and Enter
      </Button>
    </div>
  );
}

export default function SuiWalletAuth() {
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      <WalletSessionPanel />
    </DAppKitProvider>
  );
}
