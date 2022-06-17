import { FACTORY_ADDRESS } from '../../packages/constants'
import { Bundle, Pair, Token, Factory, createPairDatasource } from '../types'
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply,
  numberToBigint,
  ZERO_BI,
} from './helpers'
import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam'

type PairCreatedEventArgs = [string, string, string] & { token0: string, token1: string, pair: string }

export async function handleNewPair(event: MoonbeamEvent<PairCreatedEventArgs>): Promise<void> {
  // load factory (create if first exchange)
  let factory = await Factory.get(FACTORY_ADDRESS)
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.pairCount = 0
    factory.totalVolumeETH =0
    factory.totalLiquidityETH = 0
    factory.totalVolumeUSD = 0
    factory.untrackedVolumeUSD = 0
    factory.totalLiquidityUSD = 0
    factory.txCount = ZERO_BI

    // create new bundle
    let bundle = new Bundle('1')
    bundle.ethPrice = 0
    bundle.save()
  }
  factory.pairCount = factory.pairCount + 1
  await factory.save()

  // create the tokens
  let token0 = await Token.get(event.args.token0)
  let token1 = await Token.get(event.args.token1)

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.args.token0)
    token0.symbol = await fetchTokenSymbol(event.args.token0)
    token0.name = await fetchTokenName(event.args.token0)
    token0.totalSupply = (await fetchTokenTotalSupply(event.args.token0)).toBigInt()
    let decimals = await fetchTokenDecimals(event.args.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      logger.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals.toBigInt()
    token0.derivedETH = 0
    token0.tradeVolume = 0
    token0.tradeVolumeUSD = 0
    token0.untrackedVolumeUSD = 0
    token0.totalLiquidity = 0
    token0.txCount = ZERO_BI
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.args.token1)
    token1.symbol = await fetchTokenSymbol(event.args.token1)
    token1.name = await fetchTokenName(event.args.token1)
    token1.totalSupply = (await fetchTokenTotalSupply(event.args.token1)).toBigInt()
    let decimals = await fetchTokenDecimals(event.args.token1)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }
    token1.decimals = decimals.toBigInt()
    token1.derivedETH = 0
    token1.tradeVolume =0
    token1.tradeVolumeUSD = 0
    token1.untrackedVolumeUSD =0
    token1.totalLiquidity = 0
    token1.txCount = ZERO_BI
  }

  let pair = new Pair(event.args.pair)
  pair.token0Id = token0.id
  pair.token1Id = token1.id
  pair.liquidityProviderCount = ZERO_BI
  pair.createdAtTimestamp = numberToBigint(event.blockTimestamp.getTime())
  pair.createdAtBlockNumber = numberToBigint(event.blockNumber)
  pair.txCount = ZERO_BI
  pair.reserve0 = 0
  pair.reserve1 = 0
  pair.trackedReserveETH = 0
  pair.reserveETH = 0
  pair.reserveUSD = 0
  pair.totalSupply = 0
  pair.volumeToken0 = 0
  pair.volumeToken1 = 0
  pair.volumeUSD = 0
  pair.untrackedVolumeUSD = 0
  pair.token0Price = 0
  pair.token1Price = 0

  // create the tracked contract based on the template
  await createPairDatasource({address: event.args.pair})

  // save updated values
  await token0.save()
  await token1.save()
  await pair.save()
  await factory.save()
}
