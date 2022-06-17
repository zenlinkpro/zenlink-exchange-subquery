import { Address } from '@graphprotocol/graph-ts'
import { FACTORY_ADDRESS } from '../../packages/constants'
import { Bundle, Pair, Token, Factory, createPairDatasource } from '../types'
import {
  bigIntToBigint,
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply,
  numberToBigint,
  ZERO_BD_N,
  ZERO_BI,
} from './helpers'
import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam'

type PairCreatedEventArgs = [string, string, string] & { token0: string, token1: string, pair: string }

export async function handleNewPair(event: MoonbeamEvent<PairCreatedEventArgs>): Promise<void> {
  // load factory (create if first exchange)
  let factory = await Factory.get(FACTORY_ADDRESS.toHexString())
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS.toHexString())
    factory.pairCount = 0
    factory.totalVolumeETH =ZERO_BD_N
    factory.totalLiquidityETH = ZERO_BD_N
    factory.totalVolumeUSD = ZERO_BD_N
    factory.untrackedVolumeUSD = ZERO_BD_N
    factory.totalLiquidityUSD = ZERO_BD_N
    factory.txCount = bigIntToBigint(ZERO_BI)

    // create new bundle
    let bundle = new Bundle('1')
    bundle.ethPrice = ZERO_BD_N
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
    token0.symbol = await fetchTokenSymbol(Address.fromString(event.args.token0))
    token0.name = await fetchTokenName(Address.fromString(event.args.token0))
    token0.totalSupply = bigIntToBigint(await fetchTokenTotalSupply(Address.fromString(event.args.token0)))
    let decimals = await fetchTokenDecimals(Address.fromString(event.args.token0))

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      logger.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = bigIntToBigint(decimals)
    token0.derivedETH = ZERO_BD_N
    token0.tradeVolume = ZERO_BD_N
    token0.tradeVolumeUSD = ZERO_BD_N
    token0.untrackedVolumeUSD = ZERO_BD_N
    token0.totalLiquidity = ZERO_BD_N
    token0.txCount = bigIntToBigint(ZERO_BI)
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.args.token1)
    token1.symbol = await fetchTokenSymbol(Address.fromString(event.args.token1))
    token1.name = await fetchTokenName(Address.fromString(event.args.token1))
    token1.totalSupply = bigIntToBigint(await fetchTokenTotalSupply(Address.fromString(event.args.token1)))
    let decimals = await fetchTokenDecimals(Address.fromString(event.args.token1))

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }
    token1.decimals = bigIntToBigint(decimals)
    token1.derivedETH = ZERO_BD_N
    token1.tradeVolume =ZERO_BD_N
    token1.tradeVolumeUSD = ZERO_BD_N
    token1.untrackedVolumeUSD =ZERO_BD_N
    token1.totalLiquidity = ZERO_BD_N
    token1.txCount = bigIntToBigint(ZERO_BI)
  }

  let pair = new Pair(event.args.pair)
  pair.token0Id = token0.id
  pair.token1Id = token1.id
  pair.liquidityProviderCount = bigIntToBigint(ZERO_BI)
  pair.createdAtTimestamp = numberToBigint(event.blockTimestamp.getTime())
  pair.createdAtBlockNumber = numberToBigint(event.blockNumber)
  pair.txCount = bigIntToBigint(ZERO_BI)
  pair.reserve0 = ZERO_BD_N
  pair.reserve1 = ZERO_BD_N
  pair.trackedReserveETH = ZERO_BD_N
  pair.reserveETH = ZERO_BD_N
  pair.reserveUSD = ZERO_BD_N
  pair.totalSupply = ZERO_BD_N
  pair.volumeToken0 = ZERO_BD_N
  pair.volumeToken1 = ZERO_BD_N
  pair.volumeUSD = ZERO_BD_N
  pair.untrackedVolumeUSD = ZERO_BD_N
  pair.token0Price = ZERO_BD_N
  pair.token1Price = ZERO_BD_N

  // create the tracked contract based on the template
  await createPairDatasource({address: event.args.pair})

  // save updated values
  await token0.save()
  await token1.save()
  await pair.save()
  await factory.save()
}
