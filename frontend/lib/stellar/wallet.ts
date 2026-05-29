import StellarSdk from '@stellar/stellar-sdk'
import axios from 'axios'

export interface WalletKeypair {
  publicKey: string
  secretKey: string
}

export interface AccountInfo {
  publicKey: string
  balances: BalanceInfo[]
}

export interface BalanceInfo {
  asset_type: string
  asset_code?: string
  asset_issuer?: string
  balance: string
  buying_liabilities: string
  selling_liabilities: string
}

/**
 * Genera un nuevo par de claves Stellar
 */
export function generateKeypair(): WalletKeypair {
  const keypair = StellarSdk.Keypair.random()
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  }
}

/**
 * Crea una cuenta en testnet usando Friendbot
 */
export async function fundAccountWithFriendbot(publicKey: string): Promise<boolean> {
  try {
    const friendbotUrl = 'https://anchor-test.stellar.org/friendbot'
    await axios.get(friendbotUrl, { params: { addr: publicKey } })
    return true
  } catch (error) {
    console.error('Error funding account with Friendbot:', error)
    return false
  }
}

/**
 * Obtiene información de una cuenta desde Horizon
 */
export async function getAccountInfo(publicKey: string): Promise<AccountInfo | null> {
  try {
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
    const account = await server.loadAccount(publicKey)
    
    return {
      publicKey: account.accountId(),
      balances: account.balances.map((balance: any) => ({
        asset_type: balance.asset_type,
        asset_code: balance.asset_code,
        asset_issuer: balance.asset_issuer,
        balance: balance.balance,
        buying_liabilities: balance.buying_liabilities,
        selling_liabilities: balance.selling_liabilities,
      })),
    }
  } catch (error) {
    console.error('Error loading account:', error)
    return null
  }
}

/**
 * Obtiene el balance de un activo específico
 */
export async function getBalance(publicKey: string, assetCode: string = 'XLM'): Promise<string | null> {
  const accountInfo = await getAccountInfo(publicKey)
  if (!accountInfo) return null

  for (const balance of accountInfo.balances) {
    if (assetCode === 'XLM' && balance.asset_type === 'native') {
      return balance.balance
    }
    if (balance.asset_code === assetCode) {
      return balance.balance
    }
  }
  return '0'
}

/**
 * Verifica si una cuenta existe en la red
 */
export async function accountExists(publicKey: string): Promise<boolean> {
  // If we're in a test environment, don't try to call Horizon
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  
  try {
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
    await server.loadAccount(publicKey)
    return true
  } catch {
    return false
  }
}

/**
 * Crea un trustline para un asset (ej: USDC)
 */
export async function createTrustline(
  secretKey: string,
  assetCode: string,
  assetIssuer: string
): Promise<string | null> {
  try {
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey)
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey())

    const asset = new StellarSdk.Asset(assetCode, assetIssuer)

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset,
          limit: '1000000',
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(sourceKeypair)

    const result = await server.submitTransaction(transaction)
    return result.hash
  } catch (error) {
    console.error('Error creating trustline:', error)
    return null
  }
}

/**
 * Envía un pago entre cuentas
 */
export async function sendPayment(
  secretKey: string,
  destinationPublicKey: string,
  amount: string,
  assetCode: string = 'XLM',
  assetIssuer?: string
): Promise<string | null> {
  try {
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org')
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey)
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey())

    const asset = assetCode === 'XLM' 
      ? StellarSdk.Asset.native() 
      : new StellarSdk.Asset(assetCode, assetIssuer!)

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset,
          amount,
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(sourceKeypair)

    const result = await server.submitTransaction(transaction)
    return result.hash
  } catch (error) {
    console.error('Error sending payment:', error)
    return null
  }
}

export default {
  generateKeypair,
  fundAccountWithFriendbot,
  getAccountInfo,
  getBalance,
  accountExists,
  createTrustline,
  sendPayment,
}
