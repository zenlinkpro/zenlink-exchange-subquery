import { ADDRESS_ZERO, FACTORY_ADDRESS } from '../../packages/constants'
import { BigInt, BigDecimal, store, Address } from '@graphprotocol/graph-ts'
import {
  Pair,
  Token,
  Factory,
  Transaction,
  Mint as MintEvent,
  Burn as BurnEvent,
  Swap as SwapEvent,
  Bundle
} from '../types'
import { updatePairDayData, updateTokenDayData, updateUniswapDayData, updatePairHourData } from './dayUpdates'
import { getEthPriceInUSD, findEthPerToken, getTrackedVolumeUSD, getTrackedLiquidityUSD } from './pricing'
import {
  convertTokenToDecimal,
  ONE_BI,
  createUser,
  createLiquidityPosition,
  ZERO_BD,
  BI_18,
  createLiquiditySnapshot,
  ZERO_BI,
  provider
} from './helpers'
import { BigNumber, Contract } from 'ethers'
import { MoonbeamEvent } from '@subql/contract-processors/dist/moonbeam'
import PairAbi from '../../abis/pair.json'

type TransferEventArgs = [string, string, BigNumber] & { from: string, to: string, value: BigNumber }
type MintEventArgs = [string, BigNumber, BigNumber] & { sender: string, amount0: BigNumber, amount1: BigNumber }
type BurnEventArgs = [string, BigNumber, BigNumber, string] & { sender: string, amount0: BigNumber, amount1: BigNumber, to: string }
type SwapEventArgs = [string, BigNumber, BigNumber, BigNumber, BigNumber, string] &
  { sender: string, amount0In: BigNumber, amount1In: BigNumber, amount0Out: BigNumber, amount1Out: BigNumber, to: string }

async function isCompleteMint(mintId: string): Promise<boolean> {
  return (await MintEvent.get(mintId)).sender !== null // sufficient checks
}

export async function handleTransfer(event: MoonbeamEvent<TransferEventArgs>): Promise<void> {
  // ignore initial transfers for first adds
  if (event.args.to == ADDRESS_ZERO.toHexString() && event.args.value.eq(BigInt.fromI32(1000))) {
    return
  }

  let factory = await Factory.get(FACTORY_ADDRESS.toHexString())
  let transactionHash = event.transactionHash

  // user stats
  let from = event.args.from
  await createUser(Address.fromString(from))
  let to = event.args.to
  await createUser(Address.fromString(to))

  // get pair and load contract
  let pair = await Pair.get(event.address)
  const pairContract = new Contract(event.address, PairAbi, provider)

  // liquidity token amount being transfered
  let value = convertTokenToDecimal(BigInt.fromString(event.args.value.toString()), BI_18)

  // get or create transaction
  let transaction = await Transaction.get(transactionHash)
  if (transaction === null) {
    transaction = new Transaction(transactionHash)
    transaction.blockNumber = BigNumber.from(event.blockNumber).toBigInt()
    transaction.timestamp = BigNumber.from(event.blockTimestamp.getTime()).toBigInt()
    transaction.mintsId = []
    transaction.burnsId = []
    transaction.swapsId = []
  }

  // mints
  let mints = transaction.mintsId
  if (from == ADDRESS_ZERO.toHexString()) {
    // update total supply
    pair.totalSupply = pair.totalSupply + BigNumber.from(value).toNumber()
    await pair.save()

    // create new mint if no mints so far or if last one is done already
    if (mints.length === 0 || isCompleteMint(mints[mints.length - 1])) {
      let mint = new MintEvent(
        event.transactionHash
          .concat('-')
          .concat(BigInt.fromI32(mints.length).toString())
      )
      mint.transactionId = transaction.id
      mint.pairId = pair.id
      mint.to = to
      mint.liquidity = BigNumber.from(value).toNumber()
      mint.timestamp = transaction.timestamp
      mint.transactionId = transaction.id
      await mint.save()

      // update mints in transaction
      transaction.mintsId = mints.concat([mint.id])

      // save entities
      await transaction.save()
      await factory.save()
    }
  }

  // case where direct send first on ETH withdrawls
  if (event.args.to == pair.id) {
    let burns = transaction.burnsId
    let burn = new BurnEvent(
      event.transactionHash
        .concat('-')
        .concat(BigInt.fromI32(burns.length).toString())
    )
    burn.transactionId = transaction.id
    burn.pairId = pair.id
    burn.liquidity = BigNumber.from(value).toNumber()
    burn.timestamp = transaction.timestamp
    burn.to = event.args.to
    burn.sender = event.args.from
    burn.needsComplete = true
    burn.transactionId = transaction.id
    await burn.save()

    // TODO: Consider using .concat() for handling array updates to protect
    // against unintended side effects for other code paths.
    burns.push(burn.id)
    transaction.burnsId = burns
    await transaction.save()
  }

  // burn
  if (event.args.to == ADDRESS_ZERO.toHexString() && event.args.from == pair.id) {
    pair.totalSupply = pair.totalSupply - BigNumber.from(value).toNumber()
    await pair.save()

    // this is a new instance of a logical burn
    let burns = transaction.burnsId
    let burn: BurnEvent
    if (burns.length > 0) {
      let currentBurn = await BurnEvent.get(burns[burns.length - 1])
      if (currentBurn.needsComplete) {
        burn = currentBurn
      } else {
        burn = new BurnEvent(
          event.transactionHash
            .concat('-')
            .concat(BigInt.fromI32(burns.length).toString())
        )
        burn.transactionId = transaction.id
        burn.needsComplete = false
        burn.pairId = pair.id
        burn.liquidity = BigNumber.from(value).toNumber()
        burn.transactionId = transaction.id
        burn.timestamp = transaction.timestamp
      }
    } else {
      burn = new BurnEvent(
        event.transactionHash
          .concat('-')
          .concat(BigInt.fromI32(burns.length).toString())
      )
      burn.transactionId = transaction.id
      burn.needsComplete = false
      burn.pairId = pair.id
      burn.liquidity = BigNumber.from(value).toNumber()
      burn.transactionId = transaction.id
      burn.timestamp = transaction.timestamp
    }

    // if this logical burn included a fee mint, account for this
    if (mints.length !== 0 && !isCompleteMint(mints[mints.length - 1])) {
      let mint = await MintEvent.get(mints[mints.length - 1])
      burn.feeTo = mint.to
      burn.feeLiquidity = mint.liquidity
      // remove the logical mint
      store.remove('Mint', mints[mints.length - 1])
      // update the transaction

      // TODO: Consider using .slice().pop() to protect against unintended
      // side effects for other code paths.
      mints.pop()
      transaction.mintsId = mints
      await transaction.save()
    }
    await burn.save()
    // if accessing last one, replace it
    if (burn.needsComplete) {
      // TODO: Consider using .slice(0, -1).concat() to protect against
      // unintended side effects for other code paths.
      burns[burns.length - 1] = burn.id
    }
    // else add new one
    else {
      // TODO: Consider using .concat() for handling array updates to protect
      // against unintended side effects for other code paths.
      burns.push(burn.id)
    }
    transaction.burnsId = burns
    await transaction.save()
  }

  if (from != ADDRESS_ZERO.toHexString() && from != pair.id) {
    let fromUserLiquidityPosition = await createLiquidityPosition(Address.fromString(event.address), Address.fromString(from))
    fromUserLiquidityPosition.liquidityTokenBalance = BigNumber.from(convertTokenToDecimal(await pairContract.balanceOf(from), BI_18)).toNumber()
    await fromUserLiquidityPosition.save()
    await createLiquiditySnapshot(fromUserLiquidityPosition, event)
  }

  if (event.args.to != ADDRESS_ZERO.toHexString() && to != pair.id) {
    let toUserLiquidityPosition = await createLiquidityPosition(Address.fromString(event.address), Address.fromString(to))
    toUserLiquidityPosition.liquidityTokenBalance = BigNumber.from( convertTokenToDecimal(pairContract.balanceOf(to), BI_18)).toNumber()
    await toUserLiquidityPosition.save()
    await createLiquiditySnapshot(toUserLiquidityPosition, event)
  }

  await transaction.save()
}

export async function handleSync(
  pairAddress: Address, 
  amount0In: BigInt, 
  amount1In: BigInt,
  amount0Out: BigInt,
  amount1Out: BigInt
): Promise<void> {
  let pair = await Pair.get(pairAddress.toHex())
  let token0 = await Token.get(pair.token0Id)
  let token1 = await Token.get(pair.token1Id)
  let uniswap = await Factory.get(FACTORY_ADDRESS.toHexString())

  // reset factory liquidity by subtracting onluy tarcked liquidity
  uniswap.totalLiquidityETH = uniswap.totalLiquidityETH - pair.trackedReserveETH

  // reset token total liquidity amounts
  token0.totalLiquidity = token0.totalLiquidity - pair.reserve0
  token1.totalLiquidity = token1.totalLiquidity - pair.reserve1

  pair.reserve0 = pair.reserve0 
    + BigNumber.from(convertTokenToDecimal(amount0In, BigInt.fromI32(token0.decimals))).toNumber()
    - BigNumber.from(convertTokenToDecimal(amount0Out, BigInt.fromI32(token0.decimals))).toNumber()
  pair.reserve1 = pair.reserve1
    +  BigNumber.from(convertTokenToDecimal(amount1In, BigInt.fromI32(token1.decimals))).toNumber()
    - BigNumber.from(convertTokenToDecimal(amount1Out, BigInt.fromI32(token1.decimals))).toNumber()

  if (pair.reserve1 !== BigNumber.from(ZERO_BD).toNumber()) {
    pair.token0Price = pair.reserve0 / pair.reserve1
  } else {
    pair.token0Price = BigNumber.from(ZERO_BD).toNumber()
  }
  if (pair.reserve0 !== BigNumber.from(ZERO_BD).toNumber()) {
    pair.token1Price = pair.reserve1 / pair.reserve0
  } else {
    pair.token1Price = BigNumber.from(ZERO_BD).toNumber()
  }

  await pair.save()

  // update ETH price now that reserves could have changed
  let bundle = await Bundle.get('1')
  bundle.ethPrice = BigNumber.from(await getEthPriceInUSD()).toNumber()
  await bundle.save()

  token0.derivedETH = BigNumber.from(await findEthPerToken(token0)).toNumber()
  token1.derivedETH = BigNumber.from(await findEthPerToken(token1)).toNumber()
  await token0.save()
  await token1.save()

  // get tracked liquidity - will be 0 if neither is in whitelist
  let trackedLiquidityETH: BigDecimal
  if (bundle.ethPrice !== BigNumber.from(ZERO_BD).toNumber()) {
    trackedLiquidityETH =( await getTrackedLiquidityUSD(
      BigDecimal.fromString(pair.reserve0.toString()), 
      token0, 
      BigDecimal.fromString(pair.reserve1.toString()), 
      token1
    )).div(
      BigDecimal.fromString(bundle.ethPrice.toString())
    )
  } else {
    trackedLiquidityETH = ZERO_BD
  }

  // use derived amounts within pair
  pair.trackedReserveETH = BigNumber.from(trackedLiquidityETH).toNumber()
  pair.reserveETH = (pair.reserve0 * token0.derivedETH) + (pair.reserve1 * token1.derivedETH)
  pair.reserveUSD = pair.reserveETH * bundle.ethPrice

  // use tracked amounts globally
  uniswap.totalLiquidityETH = uniswap.totalLiquidityETH + BigNumber.from(trackedLiquidityETH).toNumber()
  uniswap.totalLiquidityUSD = uniswap.totalLiquidityETH * bundle.ethPrice

  // now correctly set liquidity amounts for each token
  token0.totalLiquidity = token0.totalLiquidity + pair.reserve0
  token1.totalLiquidity = token1.totalLiquidity + pair.reserve1

  // save entities
  await pair.save()
  await uniswap.save()
  await token0.save()
  await token1.save()
}

export async function handleMint(event: MoonbeamEvent<MintEventArgs>): Promise<void> {
  await handleSync(
    Address.fromString(event.address), 
    BigInt.fromString(event.args.amount0.toString()), 
    BigInt.fromString(event.args.amount1.toString()), 
    ZERO_BI, 
    ZERO_BI
  )
  let transaction = await Transaction.get(event.transactionHash)
  let mints = transaction.mintsId
  let mint = await MintEvent.get(mints[mints.length - 1])

  let pair = await Pair.get(event.address)
  let uniswap = await Factory.get(FACTORY_ADDRESS.toHexString())

  let token0 = await Token.get(pair.token0Id)
  let token1 = await Token.get(pair.token1Id)

  // update exchange info (except balances, sync will cover that)
  let token0Amount = convertTokenToDecimal(
    BigInt.fromString(BigNumber.from(event.args.amount0).toString()), 
    BigInt.fromString(token0.decimals.toString())
  )
  let token1Amount = convertTokenToDecimal(
    BigInt.fromString(BigNumber.from(event.args.amount1).toString()), 
    BigInt.fromString(token1.decimals.toString())
  )

  // update txn counts
  token0.txCount = token0.txCount + BigNumber.from(ONE_BI).toBigInt()
  token1.txCount = token1.txCount + BigNumber.from(ONE_BI).toBigInt()

  // get new amounts of USD and ETH for tracking
  let bundle = await Bundle.get('1')
  let amountTotalUSD = ((token1.derivedETH * BigNumber.from(token1Amount).toNumber())
    + (token0.derivedETH * BigNumber.from(token0Amount).toNumber()))
    * bundle.ethPrice

  // update txn counts
  pair.txCount = pair.txCount + BigNumber.from(ONE_BI).toBigInt()
  uniswap.txCount = uniswap.txCount + BigNumber.from(ONE_BI).toBigInt()

  // save entities
  await token0.save()
  await token1.save()
  await pair.save()
  await uniswap.save()

  mint.sender = event.args.sender
  mint.amount0 = BigNumber.from(token0Amount).toNumber()
  mint.amount1 = BigNumber.from(token1Amount).toNumber()
  mint.logIndex = BigNumber.from( event.logIndex).toBigInt()
  mint.amountUSD = amountTotalUSD
  await mint.save()

  // update the LP position
  let liquidityPosition = await createLiquidityPosition(Address.fromString(event.address), Address.fromString(mint.to))
  await createLiquiditySnapshot(liquidityPosition, event)

  // update day entities
  await updatePairDayData(event)
  await updatePairHourData(event)
  await updateUniswapDayData(event)
  await updateTokenDayData(token0, event)
  await updateTokenDayData(token1, event)
}

export async function handleBurn(event: MoonbeamEvent<BurnEventArgs>): Promise<void> {
  await handleSync(
    Address.fromString(event.address), 
    ZERO_BI, 
    ZERO_BI, 
    BigInt.fromString(event.args.amount0.toString()),
    BigInt.fromString(event.args.amount1.toString())
  )
  let transaction = await Transaction.get(event.transactionHash)

  // safety check
  if (transaction === null) {
    return
  }

  let burns = transaction.burnsId
  let burn = await BurnEvent.get(burns[burns.length - 1])

  let pair = await Pair.get(event.address)
  let uniswap = await Factory.get(FACTORY_ADDRESS.toHexString())

  //update token info
  let token0 = await Token.get(pair.token0Id)
  let token1 = await Token.get(pair.token1Id)
  let token0Amount = convertTokenToDecimal(
    BigInt.fromString(event.args.amount0.toString()),
    BigInt.fromString(token0.decimals.toString())
  )
  let token1Amount = convertTokenToDecimal(
    BigInt.fromString(event.args.amount1.toString()),
    BigInt.fromString(token1.decimals.toString())
  )

  // update txn counts
  token0.txCount = token0.txCount + BigNumber.from(ONE_BI).toBigInt()
  token1.txCount = token1.txCount + BigNumber.from(ONE_BI).toBigInt()

  // get new amounts of USD and ETH for tracking
  let bundle = await Bundle.get('1')
  let amountTotalUSD = ((token1.derivedETH * BigNumber.from(token1Amount).toNumber())
    + (token0.derivedETH * BigNumber.from(token0Amount).toNumber()))
    * bundle.ethPrice

  // update txn counts
  uniswap.txCount = uniswap.txCount + BigNumber.from(ONE_BI).toBigInt()
  pair.txCount = pair.txCount + BigNumber.from(ONE_BI).toBigInt()

  // update global counter and save
  await token0.save()
  await token1.save()
  await pair.save()
  await uniswap.save()

  // update burn
  // burn.sender = event.params.sender
  burn.amount0 = BigNumber.from(token0Amount).toNumber()
  burn.amount1 = BigNumber.from(token1Amount).toNumber()
  // burn.to = event.params.to
  burn.logIndex = BigNumber.from(event.logIndex).toBigInt()
  burn.amountUSD = amountTotalUSD
  await burn.save()

  // update the LP position
  let liquidityPosition = await createLiquidityPosition(
    Address.fromString(event.address),
    Address.fromString(burn.sender)
  )
  await createLiquiditySnapshot(liquidityPosition, event)

  // update day entities
  await updatePairDayData(event)
  await updatePairHourData(event)
  await updateUniswapDayData(event)
  await updateTokenDayData(token0, event)
  await updateTokenDayData(token1, event)
}

export async function handleSwap(event: MoonbeamEvent<SwapEventArgs>): Promise<void> {
  await handleSync(
    Address.fromString(event.address), 
    BigInt.fromString(event.args.amount0In.toString()), 
    BigInt.fromString(event.args.amount1In.toString()), 
    BigInt.fromString(event.args.amount0Out.toString()), 
    BigInt.fromString(event.args.amount1Out.toString()), 
  )
  let pair = await Pair.get(event.address)
  let token0 = await Token.get(pair.token0Id)
  let token1 = await Token.get(pair.token1Id)
  let amount0In = convertTokenToDecimal(
    BigInt.fromString(event.args.amount0In.toString()), 
    BigInt.fromString(token0.decimals.toString())
  )
  let amount1In = convertTokenToDecimal(
    BigInt.fromString(event.args.amount1In.toString()), 
    BigInt.fromString(token1.decimals.toString())
  )
  let amount0Out = convertTokenToDecimal(
    BigInt.fromString(event.args.amount0Out.toString()), 
    BigInt.fromString(token0.decimals.toString())
  )
  let amount1Out = convertTokenToDecimal(
    BigInt.fromString(event.args.amount1Out.toString()), 
    BigInt.fromString(token1.decimals.toString())
  )

  // totals for volume updates
  let amount0Total = amount0Out.plus(amount0In)
  let amount1Total = amount1Out.plus(amount1In)

  // ETH/USD prices
  let bundle = await Bundle.get('1')

  // get total amounts of derived USD and ETH for tracking
  let derivedAmountETH = (token1.derivedETH * BigNumber.from(amount1Total.toString()).toNumber()
    + (token0.derivedETH * BigNumber.from(amount0Total.toString()).toNumber()))
    / 2
  let derivedAmountUSD = derivedAmountETH * bundle.ethPrice

  // only accounts for volume through white listed tokens
  let trackedAmountUSD = await getTrackedVolumeUSD(amount0Total, token0, amount1Total, token1, pair)

  let trackedAmountETH: BigDecimal
  if (bundle.ethPrice == BigNumber.from(ZERO_BD.toString()).toNumber()) {
    trackedAmountETH = ZERO_BD
  } else {
    trackedAmountETH = trackedAmountUSD.div(BigDecimal.fromString(bundle.ethPrice.toString()))
  }

  // update token0 global volume and token liquidity stats
  token0.tradeVolume = token0.tradeVolume + BigNumber.from(amount0In.plus(amount0Out).toString()).toNumber()
  token0.tradeVolumeUSD = token0.tradeVolumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  token0.untrackedVolumeUSD = token0.untrackedVolumeUSD + BigNumber.from(derivedAmountUSD.toString()).toNumber()

  // update token1 global volume and token liquidity stats
  token1.tradeVolume = token1.tradeVolume + BigNumber.from(amount1In.plus(amount1Out).toString()).toNumber()
  token1.tradeVolumeUSD = token1.tradeVolumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  token1.untrackedVolumeUSD = token1.untrackedVolumeUSD + BigNumber.from(derivedAmountUSD.toString()).toNumber()

  // update txn counts
  token0.txCount = token0.txCount + BigNumber.from(ONE_BI).toBigInt()
  token1.txCount = token1.txCount + BigNumber.from(ONE_BI).toBigInt()

  // update pair volume data, use tracked amount if we have it as its probably more accurate
  pair.volumeUSD = pair.volumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  pair.volumeToken0 = pair.volumeToken0 + BigNumber.from(amount0Total.toString()).toNumber()
  pair.volumeToken1 = pair.volumeToken1 + BigNumber.from(amount1Total.toString()).toNumber()
  pair.untrackedVolumeUSD = pair.untrackedVolumeUSD + BigNumber.from(derivedAmountUSD.toString()).toNumber()
  pair.txCount = pair.txCount + BigNumber.from(ONE_BI).toBigInt()
  await pair.save()

  // update global values, only used tracked amounts for volume
  let uniswap = await Factory.get(FACTORY_ADDRESS.toHexString())
  uniswap.totalVolumeUSD = uniswap.totalVolumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  uniswap.totalVolumeETH = uniswap.totalVolumeETH + BigNumber.from(trackedAmountETH.toString()).toNumber()
  uniswap.untrackedVolumeUSD = uniswap.untrackedVolumeUSD + BigNumber.from(derivedAmountUSD.toString()).toNumber()
  uniswap.txCount = uniswap.txCount + BigNumber.from(ONE_BI).toBigInt()

  // save entities
  await pair.save()
  await token0.save()
  await token1.save()
  await uniswap.save()

  let transaction = await Transaction.get(event.transactionHash)
  if (transaction === null) {
    transaction = new Transaction(event.transactionHash)
    transaction.blockNumber = BigNumber.from(event.blockNumber).toBigInt()
    transaction.timestamp =  BigNumber.from(event.blockTimestamp.getTime()).toBigInt()
    transaction.mintsId = []
    transaction.swapsId = []
    transaction.burnsId = []
  }
  let swaps = transaction.swapsId
  let swap = new SwapEvent(
    event.transactionHash
      .concat('-')
      .concat(BigInt.fromI32(swaps.length).toString())
  )

  // update swap event
  swap.transactionId = transaction.id
  swap.pairId = pair.id
  swap.timestamp = transaction.timestamp
  swap.transactionId = transaction.id
  swap.sender = event.args.sender
  swap.amount0In = BigNumber.from(amount0In.toString()).toNumber()
  swap.amount1In = BigNumber.from(amount1In.toString()).toNumber()
  swap.amount0Out = BigNumber.from(amount0Out.toString()).toNumber()
  swap.amount1Out = BigNumber.from(amount1Out.toString()).toNumber()
  swap.to = event.args.to
  swap.from = event.args.sender
  swap.logIndex = BigNumber.from(event.logIndex).toBigInt()
  // use the tracked amount if we have it
  swap.amountUSD = trackedAmountUSD === ZERO_BD ? derivedAmountUSD : BigNumber.from(trackedAmountUSD.toString()).toNumber()
  await swap.save()

  // update the transaction

  // TODO: Consider using .concat() for handling array updates to protect
  // against unintended side effects for other code paths.
  swaps.push(swap.id)
  transaction.swapsId = swaps
  await transaction.save()

  // update day entities
  let pairDayData = await updatePairDayData(event)
  let pairHourData = await updatePairHourData(event)
  let uniswapDayData = await updateUniswapDayData(event)
  let token0DayData = await updateTokenDayData(token0, event)
  let token1DayData = await updateTokenDayData(token1, event)

  // swap specific updating
  uniswapDayData.dailyVolumeUSD = uniswapDayData.dailyVolumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  uniswapDayData.dailyVolumeETH = uniswapDayData.dailyVolumeETH + BigNumber.from(trackedAmountETH.toString()).toNumber()
  uniswapDayData.dailyVolumeUntracked = uniswapDayData.dailyVolumeUntracked + derivedAmountUSD
  await uniswapDayData.save()

  // swap specific updating for pair
  pairDayData.dailyVolumeToken0 = pairDayData.dailyVolumeToken0 + BigNumber.from(amount0Total.toString()).toNumber()
  pairDayData.dailyVolumeToken1 = pairDayData.dailyVolumeToken1 + BigNumber.from(amount1Total.toString()).toNumber()
  pairDayData.dailyVolumeUSD = pairDayData.dailyVolumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  await pairDayData.save()

  // update hourly pair data
  pairHourData.hourlyVolumeToken0 = pairHourData.hourlyVolumeToken0 + BigNumber.from(amount0Total.toString()).toNumber()
  pairHourData.hourlyVolumeToken1 = pairHourData.hourlyVolumeToken1 + BigNumber.from(amount1Total.toString()).toNumber()
  pairHourData.hourlyVolumeUSD = pairHourData.hourlyVolumeUSD + BigNumber.from(trackedAmountUSD.toString()).toNumber()
  await pairHourData.save()

  // swap specific updating for token0
  token0DayData.dailyVolumeToken = token0DayData.dailyVolumeToken + BigNumber.from(amount0Total.toString()).toNumber()
  token0DayData.dailyVolumeETH = token0DayData.dailyVolumeETH + (BigNumber.from(amount0Total.toString()).toNumber() * token0.derivedETH)
  token0DayData.dailyVolumeUSD = token0DayData.dailyVolumeUSD + (
    BigNumber.from(amount0Total.toString()).toNumber() * token0.derivedETH * bundle.ethPrice
  )
  await token0DayData.save()

  // swap specific updating
  token1DayData.dailyVolumeToken = token1DayData.dailyVolumeToken + BigNumber.from(amount1Total.toString()).toNumber()
  token1DayData.dailyVolumeETH = token1DayData.dailyVolumeETH + (BigNumber.from(amount1Total.toString()).toNumber() * token1.derivedETH)
  token1DayData.dailyVolumeUSD = token1DayData.dailyVolumeUSD + (
    BigNumber.from(amount1Total.toString()).toNumber() *  token0.derivedETH * bundle.ethPrice
  )
  await token1DayData.save()
}

