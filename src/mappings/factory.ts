import { FACTORY_ADDRESS } from '../constants'
import { Bundle, Pair, Token, Factory, createPairDatasource } from '../types'
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply,
  numberToBigint,
  ONE_BI,
  ZERO_BI,
} from './helpers'
import { MoonbeamEvent } from '@subql/moonbeam-evm-processor'

type PairCreatedEventArgs = [string, string, string] & { token0: string, token1: string, pair: string }

export async function handleNewPair(event: MoonbeamEvent<PairCreatedEventArgs>): Promise<void> {
  const args = {
    token0: event.args.token0.toLowerCase(),
    token1: event.args.token1.toLowerCase(),
    pair: event.args.pair.toLowerCase()
  }
  // load factory (create if first exchange)
  let factory = await Factory.get(FACTORY_ADDRESS)
  if (!factory) {
    factory = new Factory(FACTORY_ADDRESS)
    factory.pairCount = ZERO_BI
    factory.totalVolumeETH =0
    factory.totalLiquidityETH = 0
    factory.totalVolumeUSD = 0
    factory.untrackedVolumeUSD = 0
    factory.totalLiquidityUSD = 0
    factory.txCount = ZERO_BI

    // create new bundle
    const bundle = new Bundle('1')
    bundle.ethPrice = 0
    await bundle.save()
  }
  factory.pairCount = factory.pairCount + ONE_BI
  await factory.save()

  // create the tokens
  let token0 = await Token.get(args.token0)
  let token1 = await Token.get(args.token1)

  // fetch info if null
  if (!token0) {
    token0 = new Token(args.token0)
    token0.symbol = await fetchTokenSymbol(args.token0)
    token0.name = await fetchTokenName(args.token0)
    token0.totalSupply = (await fetchTokenTotalSupply(args.token0)).toBigInt()
    const decimals = await fetchTokenDecimals(args.token0)

    // bail if we couldn't figure out the decimals
    if (!decimals) {
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
  if (!token1) {
    token1 = new Token(args.token1)
    token1.symbol = await fetchTokenSymbol(args.token1)
    token1.name = await fetchTokenName(args.token1)
    token1.totalSupply = (await fetchTokenTotalSupply(args.token1)).toBigInt()
    const decimals = await fetchTokenDecimals(args.token1)

    // bail if we couldn't figure out the decimals
    if (!decimals) {
      logger.debug('mybug the decimal on token 1 was null', [])
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

  const pair = new Pair(args.pair)
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
  await createPairDatasource({ address: args.pair })

  // save updated values
  await token0.save()
  await token1.save()
  await pair.save()
  await factory.save()
}
