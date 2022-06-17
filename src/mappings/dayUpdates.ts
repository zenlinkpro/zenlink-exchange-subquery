import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam';
import { BigNumber } from 'ethers';
import { BigInt } from '@graphprotocol/graph-ts'
import { FACTORY_ADDRESS } from '../../packages/constants'
import { Bundle, Pair, PairDayData, Token, TokenDayData, ZenlinkDayData, Factory, PairHourData } from '../types'
import { bigIntToBigint, ONE_BI, ZERO_BD_N, ZERO_BI } from './helpers'

export async function updateUniswapDayData(event: MoonbeamEvent): Promise<ZenlinkDayData> {
  let uniswap = await Factory.get(FACTORY_ADDRESS.toHexString())
  let timestamp = event.blockTimestamp.getTime()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let uniswapDayData = await ZenlinkDayData.get(dayID.toString())
  if (uniswapDayData === null) {
    uniswapDayData = new ZenlinkDayData(dayID.toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.dailyVolumeUSD = ZERO_BD_N
    uniswapDayData.dailyVolumeETH = ZERO_BD_N
    uniswapDayData.totalVolumeUSD = ZERO_BD_N
    uniswapDayData.totalVolumeETH = ZERO_BD_N
    uniswapDayData.dailyVolumeUntracked = ZERO_BD_N
  }

  uniswapDayData.totalLiquidityUSD = uniswap.totalLiquidityUSD
  uniswapDayData.totalLiquidityETH = uniswap.totalLiquidityETH
  uniswapDayData.txCount = uniswap.txCount
  await uniswapDayData.save()

  return uniswapDayData
}

export async function updatePairDayData(event: MoonbeamEvent): Promise<PairDayData> {
  let timestamp = event.blockTimestamp.getTime()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let dayPairID = event.address
    .concat('-')
    .concat(BigInt.fromI32(dayID).toString())
  let pair = await Pair.get(event.address)
  let pairDayData = await PairDayData.get(dayPairID)
  if (pairDayData === null) {
    pairDayData = new PairDayData(dayPairID)
    pairDayData.date = dayStartTimestamp
    pairDayData.token0Id = pair.token0Id
    pairDayData.token1Id = pair.token1Id
    pairDayData.pairAddress = event.address
    pairDayData.dailyVolumeToken0 = ZERO_BD_N
    pairDayData.dailyVolumeToken1 = ZERO_BD_N
    pairDayData.dailyVolumeUSD = ZERO_BD_N
    pairDayData.dailyTxns = bigIntToBigint(ZERO_BI)
  }

  pairDayData.totalSupply = pair.totalSupply
  pairDayData.reserve0 = pair.reserve0
  pairDayData.reserve1 = pair.reserve1
  pairDayData.reserveUSD = pair.reserveUSD
  pairDayData.dailyTxns = BigNumber.from(pairDayData.dailyTxns.toString()).add(ONE_BI).toBigInt()
  await pairDayData.save()

  return pairDayData
}

export async function updatePairHourData(event: MoonbeamEvent): Promise<PairHourData> {
  let timestamp = event.blockTimestamp.getTime()
  let hourIndex = timestamp / 3600 // get unique hour within unix history
  let hourStartUnix = hourIndex * 3600 // want the rounded effect
  let hourPairID = event.address
    .concat('-')
    .concat(BigInt.fromI32(hourIndex).toString())
  let pair = await Pair.get(event.address)
  let pairHourData = await PairHourData.get(hourPairID)
  if (pairHourData === null) {
    pairHourData = new PairHourData(hourPairID)
    pairHourData.hourStartUnix = hourStartUnix
    pairHourData.pairId = event.address
    pairHourData.hourlyVolumeToken0 = ZERO_BD_N
    pairHourData.hourlyVolumeToken1 = ZERO_BD_N
    pairHourData.hourlyVolumeUSD = ZERO_BD_N
    pairHourData.hourlyTxns = bigIntToBigint(ZERO_BI)
  }

  pairHourData.totalSupply = pair.totalSupply
  pairHourData.reserve0 = pair.reserve0
  pairHourData.reserve1 = pair.reserve1
  pairHourData.reserveUSD = pair.reserveUSD
  pairHourData.hourlyTxns = BigNumber.from(pairHourData.hourlyTxns.toString()).add(ONE_BI).toBigInt()
  await pairHourData.save()

  return pairHourData
}

export async function updateTokenDayData(token: Token, event: MoonbeamEvent): Promise<TokenDayData> {
  let bundle = await Bundle.get('1')
  let timestamp = event.blockTimestamp.getTime()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(BigInt.fromI32(dayID).toString())

  let tokenDayData = await TokenDayData.get(tokenDayID)
  if (tokenDayData === null) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.tokenId = token.id
    tokenDayData.priceUSD = token.derivedETH * bundle.ethPrice
    tokenDayData.dailyVolumeToken = ZERO_BD_N
    tokenDayData.dailyVolumeETH = ZERO_BD_N
    tokenDayData.dailyVolumeUSD = ZERO_BD_N
    tokenDayData.dailyTxns = bigIntToBigint(ZERO_BI)
    tokenDayData.totalLiquidityUSD = ZERO_BD_N
  }
  tokenDayData.priceUSD = token.derivedETH * bundle.ethPrice
  tokenDayData.totalLiquidityToken = token.totalLiquidity
  tokenDayData.totalLiquidityETH = token.totalLiquidity * token.derivedETH
  tokenDayData.totalLiquidityUSD = tokenDayData.totalLiquidityETH * bundle.ethPrice
  tokenDayData.dailyTxns = BigNumber.from(tokenDayData.dailyTxns.toString()).add(ONE_BI).toBigInt()
  await tokenDayData.save()

  return tokenDayData
}
