import { User, Bundle, Token, LiquidityPosition, LiquidityPositionSnapshot, Pair } from '../types'
import FactoryAbi from '../abis/factory.json'
import ERC20Abi from '../abis/ERC20.json'
import ERC20SymbolBytesAbi from '../abis/ERC20SymbolBytes.json'
import ERC20NameBytesAbi from  '../abis/ERC20NameBytes.json'
import { FACTORY_ADDRESS } from '../constants'
import { BigNumber, Contract } from 'ethers'
import { FrontierEthProvider } from '@subql/frontier-evm-processor'
import { MoonbeamEvent } from '@subql/moonbeam-evm-processor'
import BigDecimal from 'bignumber.js'

export let ZERO_BN = BigNumber.from(0)
export let ONE_BN = BigNumber.from(1)
export let ZERO_BD = new BigDecimal(0)
export let ONE_BD = new BigDecimal(1)
export let ZERO_BI = BigInt(0)
export let ONE_BI = BigInt(1)
export let BN_18 = BigNumber.from(18)

export const provider =  new FrontierEthProvider()
export const factoryContract = new Contract(FACTORY_ADDRESS, FactoryAbi, provider)

export function exponentToBigDecimal(decimals: BigNumber): BigDecimal {
  let bd = ONE_BD
  for (let i = 0; i < decimals.toNumber(); i++) {
    bd = bd.times(new BigDecimal('10'))
  }
  return bd
}

export function bigDecimalExp18(): BigDecimal {
  return new BigDecimal('1000000000000000000')
}

export function convertEthToDecimal(eth: BigNumber): BigDecimal {
  return new BigDecimal(eth.toString()).div(exponentToBigDecimal(BigNumber.from('18')))
}

export function convertTokenToDecimal(tokenAmount: BigNumber, exchangeDecimals: BigNumber): BigDecimal {
  if (exchangeDecimals == ZERO_BN) {
    return new BigDecimal(tokenAmount.toString())
  }
  return new BigDecimal(tokenAmount.toString()).div(exponentToBigDecimal(exchangeDecimals))
}

export function equalToZero(value: BigDecimal): boolean {
  const formattedVal = parseFloat(value.toString())
  const zero = parseFloat(ZERO_BD.toString())
  if (zero == formattedVal) {
    return true
  }
  return false
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function bigDecimalToNumber(value: BigDecimal): number {
  return BigNumber.from(value.toString()).toNumber()
}

export function numberToBigint(value: number): bigint {
  return BigNumber.from(value).toBigInt()
}

export function numberToBigDecimal(value: number): BigDecimal {
  return new BigDecimal(BigNumber.from(value).toString())
}

export async function fetchTokenSymbol(tokenAddress: string): Promise<string> {
  let contract = new Contract(tokenAddress, ERC20Abi, provider)
  let contractSymbolBytes = new Contract(tokenAddress, ERC20SymbolBytesAbi, provider)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = await contract.symbol()
  if (!symbolResult) {
    let symbolResultBytes = await contractSymbolBytes.symbol()
    if (symbolResultBytes) {
      symbolValue = symbolResultBytes
    }
  } else {
    symbolValue = symbolResult
  }

  return symbolValue
}

export async function fetchTokenName(tokenAddress: string): Promise<string> {
  let contract = new Contract(tokenAddress, ERC20Abi, provider)
  let contractNameBytes =  new Contract(tokenAddress, ERC20NameBytesAbi, provider)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = await contract.name()
  if (!nameResult) {
    let nameResultBytes = await contractNameBytes.name()
    if (nameResultBytes) {
      nameValue = nameResultBytes
    }
  } else {
    nameValue = nameResult
  }

  return nameValue
}

export async function fetchTokenTotalSupply(tokenAddress: string): Promise<BigNumber> {
  let contract = new Contract(tokenAddress, ERC20Abi, provider)
  let totalSupplyValue: BigNumber
  let totalSupplyResult = await contract.totalSupply()
  if (totalSupplyResult) {
    totalSupplyValue = totalSupplyResult
  }
  return totalSupplyValue
}

export async function fetchTokenDecimals(tokenAddress: string): Promise<BigNumber> {
  let contract = new Contract(tokenAddress, ERC20Abi, provider)
  // try types uint8 for decimals
  let decimalValue: BigNumber
  let decimalResult = await contract.decimals()
  if (decimalResult) {
    decimalValue = BigNumber.from(decimalResult.toString())
  }
  return decimalValue
}

export async function createLiquidityPosition(exchange: string, user: string): Promise<LiquidityPosition> {
  let id = exchange.concat('-').concat(user)
  let liquidityTokenBalance = await LiquidityPosition.get(id)
  if (!liquidityTokenBalance) {
    let pair = await Pair.get(exchange)
    pair.liquidityProviderCount = BigNumber.from(pair.liquidityProviderCount).add(ONE_BN).toBigInt()
    liquidityTokenBalance = new LiquidityPosition(id)
    liquidityTokenBalance.liquidityTokenBalance = bigDecimalToNumber(ZERO_BD) 
    liquidityTokenBalance.pairId = exchange
    liquidityTokenBalance.userId = user
    await liquidityTokenBalance.save()
    await pair.save()
  }
  if (!liquidityTokenBalance)
    logger.error('LiquidityTokenBalance is null', [id])
  return liquidityTokenBalance
}

export async function createUser(address: string): Promise<void> {
  let user = await User.get(address)
  if (!user) {
    user = new User(address)
    user.usdSwapped = bigDecimalToNumber(ZERO_BD)
    await user.save()
  }
}

export async function createLiquiditySnapshot(position: LiquidityPosition, event: MoonbeamEvent): Promise<void> {
  let timestamp = event.blockTimestamp.getTime()
  let bundle = await Bundle.get('1')
  let pair = await Pair.get(position.pairId)
  let token0 = await Token.get(pair.token0Id)
  let token1 = await Token.get(pair.token1Id)

  // create new snapshot
  let snapshot = new LiquidityPositionSnapshot(position.id.concat(timestamp.toString()))
  snapshot.liquidityPositionId = position.id
  snapshot.timestamp = timestamp
  snapshot.block = event.blockNumber
  snapshot.userId = position.userId
  snapshot.pairId = position.pairId
  snapshot.token0PriceUSD = token0.derivedETH * bundle.ethPrice
  snapshot.token1PriceUSD = token1.derivedETH * bundle.ethPrice
  snapshot.reserve0 = pair.reserve0
  snapshot.reserve1 = pair.reserve1
  snapshot.reserveUSD = pair.reserveUSD
  snapshot.liquidityTokenTotalSupply = pair.totalSupply
  snapshot.liquidityTokenBalance = position.liquidityTokenBalance
  snapshot.liquidityPositionId = position.id
  await snapshot.save()
  await position.save()
}
