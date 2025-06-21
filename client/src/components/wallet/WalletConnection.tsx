'use client'

import { AlertCircle, Check, Copy, ExternalLink, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { formatEther } from 'viem'

export function WalletConnection() {
  const { profile, connectWallet, disconnectWallet } = useAuth()
  const { address, isConnected } = useAccount()
  const { connect, connectors, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })

  const [copied, setCopied] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [pendingConnectorId, setPendingConnectorId] = useState<string | null>(null)

  // Clear pending connector state when connection changes
  useEffect(() => {
    if (isConnected || error) {
      setPendingConnectorId(null)
    }
  }, [isConnected, error])

  // Sync wallet connection with profile
  useEffect(() => {
    const syncWalletConnection = async () => {
      if (isConnected && address && address !== profile?.wallet_address) {
        setIsUpdating(true)
        try {
          await connectWallet(address)
        } catch (error) {
          console.error('Error syncing wallet:', error)
        } finally {
          setIsUpdating(false)
        }
      }
    }

    syncWalletConnection()
  }, [isConnected, address, profile?.wallet_address, connectWallet])

  const handleConnect = async (connector: any) => {
    try {
      setPendingConnectorId(connector.id)
      connect({ connector })
    } catch (error) {
      console.error('Wallet connection error:', error)
    } finally {
      setPendingConnectorId(null)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsUpdating(true)
      disconnect()
      await disconnectWallet()
    } catch (error) {
      console.error('Wallet disconnection error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const openInExplorer = () => {
    if (address) {
      window.open(`https://etherscan.io/address/${address}`, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connection
          </CardTitle>
          <CardDescription>
            Connect your Ethereum wallet to participate in NFT features and receive rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose a wallet to connect to the GoReal platform:
              </p>
              
              <div className="grid gap-3">
                {connectors.map((connector) => (
                  <Button
                    key={connector.id}
                    variant="outline"
                    onClick={() => handleConnect(connector)}
                    disabled={!connector.ready || pendingConnectorId !== null}
                    className="justify-start h-auto p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{connector.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {!connector.ready && ' (unsupported)'}
                          {pendingConnectorId === connector.id && ' (connecting)'}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Connected Wallet Info */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-green-900 dark:text-green-100">
                      Wallet Connected
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      {formatAddress(address!)}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Connected
                </Badge>
              </div>

              {/* Wallet Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {formatAddress(address!)}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAddress}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openInExplorer}
                      className="shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {balance && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ETH Balance</label>
                    <div className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
                      {parseFloat(formatEther(balance.value)).toFixed(4)} ETH
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? 'Updating...' : 'Disconnect Wallet'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Benefits</CardTitle>
          <CardDescription>
            What you can do with a connected wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mt-0.5">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium">Receive NFT Rewards</h4>
                <p className="text-sm text-muted-foreground">
                  Get NFT rewards for completing challenges and creating content
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mt-0.5">
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium">Trade Property Shares</h4>
                <p className="text-sm text-muted-foreground">
                  Buy and sell fractional ownership in real estate properties
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mt-0.5">
                <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium">Secure Transactions</h4>
                <p className="text-sm text-muted-foreground">
                  All transactions are secured by the Ethereum blockchain
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
