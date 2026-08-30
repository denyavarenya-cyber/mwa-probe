import './polyfills'

import { useState } from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { Buffer } from 'buffer'

const APP_IDENTITY = {
  name: 'MWA Probe',
  uri: 'https://example.com',
  icon: 'favicon.ico',
}

export default function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = async () => {
    setError(null)
    try {
      const auth = await transact(async (wallet) => {
        return wallet.authorize({
          chain: 'solana:devnet',
          identity: APP_IDENTITY,
        })
      })
      const pk = new PublicKey(Buffer.from(auth.accounts[0].address, 'base64'))
      setAddress(pk.toBase58())

      const conn = new Connection(clusterApiUrl('devnet'), 'confirmed')
      setBalance(await conn.getBalance(pk))
    } catch (e: any) {
      setError(String(e?.message ?? e))
    }
  }

  const sign = async () => {
    setError(null)
    try {
      const res = await transact(async (wallet) => {
        const auth = await wallet.authorize({
          chain: 'solana:devnet',
          identity: APP_IDENTITY,
        })
        return wallet.signMessages({
          addresses: [auth.accounts[0].address],
          payloads: [Uint8Array.from(Buffer.from('hello from mwa-probe', 'utf8'))],
        })
      })
      setSignature(Buffer.from(res[0]).toString('base64').slice(0, 32) + '…')
    } catch (e: any) {
      setError(String(e?.message ?? e))
    }
  }

  return (
    <View style={styles.c}>
      <Button title="Connect" onPress={connect} />
      <Button title="Sign message" onPress={sign} />
      <Text style={styles.t}>address: {address ?? '—'}</Text>
      <Text style={styles.t}>balance: {balance ?? '—'} lamports</Text>
      <Text style={styles.t}>signature: {signature ?? '—'}</Text>
      {error && <Text style={styles.e}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  t: { fontSize: 12 },
  e: { fontSize: 12, color: 'red' },
})