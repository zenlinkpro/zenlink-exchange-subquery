import { Address } from '@graphprotocol/graph-ts'
import { FACTORY_ADDRESS } from '../../packages/constants'
import { Bundle, Pair, Token, Factory, createPairDatasource } from '../types'
import {
  fetchTokenDecimals,
  fetchTokenName,
  fetchTokenSymbol,
  fetchTokenTotalSupply,
  ZERO_BD,
  ZERO_BI,
} from './helpers'
import { BigNumber } from 'ethers'
import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam'

type PairCreatedEventArgs = [string, string, string] & { token0: string, token1: string, pair: string }

export async function handleNewPair(event: MoonbeamEvent<PairCreatedEventArgs>): Promise<void> {
  // load factory (create if first exchange)
  let factory = await Factory.get(FACTORY_ADDRESS.toHexString())
  if (factory === null) {
    factory = new Factory(FACTORY_ADDRESS.toHexString())
    factory.pairCount = 0
    factory.totalVolumeETH = BigNumber.from(ZERO_BD).toNumber()
    factory.totalLiquidityETH = BigNumber.from(ZERO_BD).toNumber()
    factory.totalVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    factory.untrackedVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    factory.totalLiquidityUSD = BigNumber.from(ZERO_BD).toNumber()
    factory.txCount = BigNumber.from(ZERO_BI).toBigInt()

    // create new bundle
    let bundle = new Bundle('1')
    bundle.ethPrice = BigNumber.from(ZERO_BD).toNumber()
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
    token0.totalSupply = BigNumber.from(
      (await fetchTokenTotalSupply(Address.fromString(event.args.token0)))
    ).toBigInt()
    let decimals = await fetchTokenDecimals(Address.fromString(event.args.token0))

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      logger.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = BigNumber.from(decimals).toBigInt()
    token0.derivedETH = BigNumber.from(ZERO_BD).toNumber()
    token0.tradeVolume = BigNumber.from(ZERO_BD).toNumber()
    token0.tradeVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    token0.untrackedVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    token0.totalLiquidity = BigNumber.from(ZERO_BD).toNumber()
    token0.txCount = BigNumber.from(ZERO_BI).toBigInt()
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.args.token1)
    token1.symbol = await fetchTokenSymbol(Address.fromString(event.args.token1))
    token1.name = await fetchTokenName(Address.fromString(event.args.token1))
    token1.totalSupply = BigNumber.from(
      (await fetchTokenTotalSupply(Address.fromString(event.args.token1)))
    ).toBigInt()
    let decimals = await fetchTokenDecimals(Address.fromString(event.args.token1))

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }
    token1.decimals = BigNumber.from(decimals).toBigInt()
    token1.derivedETH = BigNumber.from(ZERO_BD).toNumber()
    token1.tradeVolume = BigNumber.from(ZERO_BD).toNumber()
    token1.tradeVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    token1.untrackedVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
    token1.totalLiquidity = BigNumber.from(ZERO_BD).toNumber()
    token1.txCount = BigNumber.from(ZERO_BI).toBigInt()
  }

  let pair = new Pair(event.args.pair)
  pair.token0Id = token0.id
  pair.token1Id = token1.id
  pair.liquidityProviderCount = BigNumber.from(ZERO_BI).toBigInt()
  pair.createdAtTimestamp = BigNumber.from(event.blockTimestamp.getTime()).toBigInt()
  pair.createdAtBlockNumber = BigNumber.from(event.blockNumber).toBigInt()
  pair.txCount = BigNumber.from(ZERO_BI).toBigInt()
  pair.reserve0 = BigNumber.from(ZERO_BD).toNumber()
  pair.reserve1 = BigNumber.from(ZERO_BD).toNumber()
  pair.trackedReserveETH = BigNumber.from(ZERO_BD).toNumber()
  pair.reserveETH = BigNumber.from(ZERO_BD).toNumber()
  pair.reserveUSD = BigNumber.from(ZERO_BD).toNumber()
  pair.totalSupply = BigNumber.from(ZERO_BD).toNumber()
  pair.volumeToken0 = BigNumber.from(ZERO_BD).toNumber()
  pair.volumeToken1 = BigNumber.from(ZERO_BD).toNumber()
  pair.volumeUSD = BigNumber.from(ZERO_BD).toNumber()
  pair.untrackedVolumeUSD = BigNumber.from(ZERO_BD).toNumber()
  pair.token0Price = BigNumber.from(ZERO_BD).toNumber()
  pair.token1Price = BigNumber.from(ZERO_BD).toNumber()

  // create the tracked contract based on the template
  await createPairDatasource({address: event.args.pair})

  // save updated values
  await token0.save()
  await token1.save()
  await pair.save()
  await factory.save()
}
