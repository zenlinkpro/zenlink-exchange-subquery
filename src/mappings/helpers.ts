import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { User, Bundle, Token, LiquidityPosition, LiquidityPositionSnapshot, Pair } from '../types'
import FactoryAbi from '../../abis/factory.json'
import ERC20Abi from '../../abis/ERC20.json'
import ERC20SymbolBytesAbi from '../../abis/ERC20SymbolBytes.json'
import ERC20NameBytesAbi from  '../../abis/ERC20NameBytes.json'
import { TokenDefinition } from './tokenDefinition'
import { FACTORY_ADDRESS } from '../../packages/constants'
import { BigNumber, Contract } from 'ethers'
import { FrontierEthProvider } from '@subql/frontier-evm-processor'
import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let BI_18 = BigInt.fromI32(18)
export let ZERO_BD_N = bigDecimalToNumber(ZERO_BD)

export const provider =  new FrontierEthProvider()
export const factoryContract = new Contract(FACTORY_ADDRESS.toHexString(), FactoryAbi, provider)

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function bigDecimalExp18(): BigDecimal {
  return BigDecimal.fromString('1000000000000000000')
}

export function convertEthToDecimal(eth: BigInt): BigDecimal {
  return eth.toBigDecimal().div(exponentToBigDecimal(new BigInt(18)))
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  if (exchangeDecimals == ZERO_BI) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exponentToBigDecimal(exchangeDecimals))
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

export function bigintToBigInt(value: bigint): BigInt {
  return BigInt.fromString(value.toString())
}

export function bigIntToBigint(value: BigInt): bigint {
  return BigNumber.from(value.toString()).toBigInt()
}

export function numberToBigDecimal(value: number): BigDecimal {
  return BigDecimal.fromString(BigNumber.from(value).toString())
}

export function bigNumberToBigInt(value: BigNumber): BigInt {
  return BigInt.fromString(value.toString())
}

export async function fetchTokenSymbol(tokenAddress: Address): Promise<string> {
  // static definitions overrides
  let staticDefinition = TokenDefinition.fromAddress(tokenAddress)
  if(staticDefinition != null) {
    return staticDefinition.symbol
  }

  let contract = new Contract(tokenAddress.toHexString(), ERC20Abi, provider)
  let contractSymbolBytes = new Contract(tokenAddress.toHexString(), ERC20SymbolBytesAbi, provider)

  // try types string and bytes32 for symbol
  let symbolValue = 'unknown'
  let symbolResult = await contract.symbol()
  if (symbolResult.reverted) {
    let symbolResultBytes = await contractSymbolBytes.symbol()
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString()
      }
    }
  } else {
    symbolValue = symbolResult.value
  }

  return symbolValue
}

export async function fetchTokenName(tokenAddress: Address): Promise<string> {
  // static definitions overrides
  let staticDefinition = TokenDefinition.fromAddress(tokenAddress)
  if(staticDefinition != null) {
    return staticDefinition.name
  }

  let contract = new Contract(tokenAddress.toHexString(), ERC20Abi, provider)
  let contractNameBytes =  new Contract(tokenAddress.toHexString(), ERC20NameBytesAbi, provider)

  // try types string and bytes32 for name
  let nameValue = 'unknown'
  let nameResult = await contract.name()
  if (nameResult.reverted) {
    let nameResultBytes = await contractNameBytes.name()
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString()
      }
    }
  } else {
    nameValue = nameResult.value
  }

  return nameValue
}

export function fetchTokenTotalSupply(tokenAddress: Address): BigInt {
  let contract = new Contract(tokenAddress.toHexString(), ERC20Abi, provider)
  let totalSupplyValue: BigInt
  let totalSupplyResult = contract.totalSupply()
  if (!totalSupplyResult.reverted) {
    totalSupplyValue = totalSupplyResult.value
  }
  return totalSupplyValue
}

export async function fetchTokenDecimals(tokenAddress: Address): Promise<BigInt> {
  // static definitions overrides
  let staticDefinition = TokenDefinition.fromAddress(tokenAddress)
  if(staticDefinition != null) {
    return staticDefinition.decimals
  }

  let contract = new Contract(tokenAddress.toHexString(), ERC20Abi, provider)
  // try types uint8 for decimals
  let decimalValue: number
  let decimalResult = await contract.decimals()
  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }
  return BigInt.fromI32(decimalValue)
}

export async function createLiquidityPosition(exchange: Address, user: Address): Promise<LiquidityPosition> {
  let id = exchange
    .toHexString()
    .concat('-')
    .concat(user.toHexString())
  let liquidityTokenBalance = await LiquidityPosition.get(id)
  if (liquidityTokenBalance === null) {
    let pair = await Pair.get(exchange.toHexString())
    pair.liquidityProviderCount = BigNumber.from(pair.liquidityProviderCount).add(ONE_BI).toBigInt()
    liquidityTokenBalance = new LiquidityPosition(id)
    liquidityTokenBalance.liquidityTokenBalance = bigDecimalToNumber(ZERO_BD) 
    liquidityTokenBalance.pairId = exchange.toHexString()
    liquidityTokenBalance.userId = user.toHexString()
    await liquidityTokenBalance.save()
    await pair.save()
  }
  if (liquidityTokenBalance === null)
    logger.error('LiquidityTokenBalance is null', [id])
  return liquidityTokenBalance
}

export async function createUser(address: Address): Promise<void> {
  let user = await User.get(address.toHexString())
  if (user === null) {
    user = new User(address.toHexString())
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
