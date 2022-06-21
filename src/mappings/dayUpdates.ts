import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam';
import { BigNumber } from 'ethers';
import { FACTORY_ADDRESS } from '../constants'
import { Bundle, Pair, PairDayData, Token, TokenDayData, ZenlinkDayData, Factory, PairHourData } from '../types'
import { ONE_BI, ZERO_BI } from './helpers';

export async function updateUniswapDayData(event: MoonbeamEvent): Promise<ZenlinkDayData> {
  const uniswap = await Factory.get(FACTORY_ADDRESS)
  const timestamp = event.blockTimestamp.getTime()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  let uniswapDayData = await ZenlinkDayData.get(dayID.toString())
  if (!uniswapDayData) {
    uniswapDayData = new ZenlinkDayData(dayID.toString())
    uniswapDayData.date = dayStartTimestamp
    uniswapDayData.dailyVolumeUSD = 0
    uniswapDayData.dailyVolumeETH = 0
    uniswapDayData.totalVolumeUSD = 0
    uniswapDayData.totalVolumeETH = 0
    uniswapDayData.dailyVolumeUntracked = 0
  }

  uniswapDayData.totalLiquidityUSD = uniswap.totalLiquidityUSD
  uniswapDayData.totalLiquidityETH = uniswap.totalLiquidityETH
  uniswapDayData.txCount = uniswap.txCount
  await uniswapDayData.save()

  return uniswapDayData
}

export async function updatePairDayData(event: MoonbeamEvent): Promise<PairDayData> {
  const timestamp = event.blockTimestamp.getTime()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const dayPairID = event.address
    .concat('-')
    .concat(BigNumber.from(dayID).toString())
  const pair = await Pair.get(event.address)
  let pairDayData = await PairDayData.get(dayPairID)
  if (!pairDayData) {
    pairDayData = new PairDayData(dayPairID)
    pairDayData.date = dayStartTimestamp
    pairDayData.token0Id = pair.token0Id
    pairDayData.token1Id = pair.token1Id
    pairDayData.pairAddress = event.address
    pairDayData.dailyVolumeToken0 = 0
    pairDayData.dailyVolumeToken1 = 0
    pairDayData.dailyVolumeUSD = 0
    pairDayData.dailyTxns = ONE_BI
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
  const timestamp = event.blockTimestamp.getTime()
  const hourIndex = timestamp / 3600 // get unique hour within unix history
  const hourStartUnix = hourIndex * 3600 // want the rounded effect
  const hourPairID = event.address
    .concat('-')
    .concat(BigNumber.from(hourIndex).toString())
  const pair = await Pair.get(event.address)
  let pairHourData = await PairHourData.get(hourPairID)
  if (!pairHourData) {
    pairHourData = new PairHourData(hourPairID)
    pairHourData.hourStartUnix = hourStartUnix
    pairHourData.pairId = event.address
    pairHourData.hourlyVolumeToken0 = 0
    pairHourData.hourlyVolumeToken1 = 0
    pairHourData.hourlyVolumeUSD = 0
    pairHourData.hourlyTxns = ZERO_BI
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
  const bundle = await Bundle.get('1')
  const timestamp = event.blockTimestamp.getTime()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const tokenDayID = token.id
    .toString()
    .concat('-')
    .concat(BigNumber.from(dayID).toString())

  let tokenDayData = await TokenDayData.get(tokenDayID)
  if (!tokenDayData) {
    tokenDayData = new TokenDayData(tokenDayID)
    tokenDayData.date = dayStartTimestamp
    tokenDayData.tokenId = token.id
    tokenDayData.priceUSD = token.derivedETH * bundle.ethPrice
    tokenDayData.dailyVolumeToken = 0
    tokenDayData.dailyVolumeETH = 0
    tokenDayData.dailyVolumeUSD = 0
    tokenDayData.dailyTxns = ZERO_BI
    tokenDayData.totalLiquidityUSD = 0
  }
  tokenDayData.priceUSD = token.derivedETH * bundle.ethPrice
  tokenDayData.totalLiquidityToken = token.totalLiquidity
  tokenDayData.totalLiquidityETH = token.totalLiquidity * token.derivedETH
  tokenDayData.totalLiquidityUSD = tokenDayData.totalLiquidityETH * bundle.ethPrice
  tokenDayData.dailyTxns = BigNumber.from(tokenDayData.dailyTxns.toString()).add(ONE_BI).toBigInt()
  await tokenDayData.save()

  return tokenDayData
}
