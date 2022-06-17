import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam';
import { BigNumber } from 'ethers';
import { BigInt } from '@graphprotocol/graph-ts'
import { FACTORY_ADDRESS } from '../../packages/constants'
import { Bundle, Pair, PairDayData, Token, TokenDayData, ZenlinkDayData, Factory, PairHourData } from '../types'
import {ONE_BI, ZERO_BD, ZERO_BI } from './helpers'

export async function updateUniswapDayData(event: MoonbeamEvent): Promise<ZenlinkDayData> {
  let uniswap = await Factory.get(FACTORY_ADDRESS.toHexString())
  let timestamp = event.blockTimestamp.getTime()
  let dayID = timestamp / 86400
  let dayStartTimestamp = dayID * 86400
  let uniswapDayData = await ZenlinkDayData.get(dayID.toString())
  if (uniswapDayData === null) {
    uniswapDayData = new ZenlinkDayData(dayID.toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.dailyVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    uniswapDayData.dailyVolumeETH = BigNumber.from(ZERO_BD).toNumber()
    uniswapDayData.totalVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    uniswapDayData.totalVolumeETH = BigNumber.from(ZERO_BD).toNumber()
    uniswapDayData.dailyVolumeUntracked = BigNumber.from(ZERO_BD).toNumber()
  }

  uniswapDayData.totalLiquidityUSD = uniswap.totalLiquidityUSD
  uniswapDayData.totalLiquidityETH = uniswap.totalLiquidityETH
  uniswapDayData.txCount = uniswap.txCount
  await uniswapDayData.save()

  return uniswapDayData as ZenlinkDayData
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
    pairDayData.dailyVolumeToken0 = BigNumber.from(ZERO_BD).toNumber()
    pairDayData.dailyVolumeToken1 = BigNumber.from(ZERO_BD).toNumber()
    pairDayData.dailyVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    pairDayData.dailyTxns = BigNumber.from(ZERO_BI).toBigInt()
  }

  pairDayData.totalSupply = pair.totalSupply
  pairDayData.reserve0 = pair.reserve0
  pairDayData.reserve1 = pair.reserve1
  pairDayData.reserveUSD = pair.reserveUSD
  pairDayData.dailyTxns = BigNumber.from(pairDayData.dailyTxns).add(ONE_BI).toBigInt()
  await pairDayData.save()

  return pairDayData as PairDayData
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
    pairHourData.hourlyVolumeToken0 = BigNumber.from(ZERO_BD).toNumber()
    pairHourData.hourlyVolumeToken1 = BigNumber.from(ZERO_BD).toNumber()
    pairHourData.hourlyVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    pairHourData.hourlyTxns = BigNumber.from(ZERO_BI).toBigInt()
  }

  pairHourData.totalSupply = pair.totalSupply
  pairHourData.reserve0 = pair.reserve0
  pairHourData.reserve1 = pair.reserve1
  pairHourData.reserveUSD = pair.reserveUSD
  pairHourData.hourlyTxns = BigNumber.from(pairHourData.hourlyTxns).add(ONE_BI).toBigInt()
  await pairHourData.save()

  return pairHourData as PairHourData
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
    tokenDayData.dailyVolumeToken = BigNumber.from(ZERO_BD).toNumber()
    tokenDayData.dailyVolumeETH = BigNumber.from(ZERO_BD).toNumber()
    tokenDayData.dailyVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    tokenDayData.dailyTxns = BigNumber.from(ZERO_BI).toBigInt()
    tokenDayData.totalLiquidityUSD = BigNumber.from(ZERO_BD).toNumber()
  }
  tokenDayData.priceUSD = token.derivedETH * bundle.ethPrice
  tokenDayData.totalLiquidityToken = token.totalLiquidity
  tokenDayData.totalLiquidityETH = token.totalLiquidity * token.derivedETH
  tokenDayData.totalLiquidityUSD = tokenDayData.totalLiquidityETH * bundle.ethPrice
  tokenDayData.dailyTxns = BigNumber.from(tokenDayData.dailyTxns).add(ONE_BI).toBigInt()
  await tokenDayData.save()

  return tokenDayData as TokenDayData
}
