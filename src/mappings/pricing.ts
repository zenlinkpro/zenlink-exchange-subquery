import { WETH_USDC_PAIR, WETH_ADDRESS, ADDRESS_ZERO, USDC_ADDRESS, WHITELIST } from '../../packages/constants'
import { Pair, Token, Bundle } from '../types'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ONE_BD } from './helpers'
import { BigNumber } from 'ethers'

export async function getEthPriceInUSD(): Promise<BigDecimal> {
  let usdcPair = await Pair.get(WETH_USDC_PAIR)

  if (usdcPair !== null) {
    let isUsdcFirst = usdcPair.token0Id == USDC_ADDRESS
    return isUsdcFirst 
      ? BigDecimal.fromString(usdcPair.token0Price.toString()) 
      : BigDecimal.fromString(usdcPair.token1Price.toString())
  } else {
    logger.warn('No usdcPair', [])
    return ZERO_BD
  }
}

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('3000')

// minimum liquidity for price to get tracked
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('5')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export async function findEthPerToken(token: Token): Promise<BigDecimal> {
  if (token.id == WETH_ADDRESS.toHexString()) {
    return ONE_BD
  }
  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHexString() != ADDRESS_ZERO.toHexString()) {
      let pair = await Pair.get(pairAddress.toHexString())
      if (pair.token0Id == token.id && pair.reserveETH > BigNumber.from(MINIMUM_LIQUIDITY_THRESHOLD_ETH).toNumber()) {
        let token1 = await Token.get(pair.token1Id)
        return BigDecimal.fromString((pair.token1Price * token1.derivedETH).toString()) // return token1 per our token * Eth per token 1
      }
      if (pair.token1Id == token.id && pair.reserveETH > BigNumber.from(MINIMUM_LIQUIDITY_THRESHOLD_ETH).toNumber()) {
        let token0 = await Token.get(pair.token0Id)
        return BigDecimal.fromString((pair.token1Price * token0.derivedETH).toString()) // return token0 per our token * ETH per token 0
      }
    }
  }
  return ZERO_BD // nothing was found return 0
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export async function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  pair: Pair
): Promise<BigDecimal> {
  let bundle = await Bundle.get('1')
  let price0 = token0.derivedETH * bundle.ethPrice
  let price1 = token1.derivedETH * bundle.ethPrice

  // if less than 5 LPs, require high minimum reserve amount amount or return 0
  if (Number(pair.liquidityProviderCount) < 5) {
    let reserve0USD = pair.reserve0 * price0
    let reserve1USD = pair.reserve1 * price1
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if ((reserve0USD + reserve1USD) < BigNumber.from(MINIMUM_USD_THRESHOLD_NEW_PAIRS).toNumber()) {
        return ZERO_BD
      }
    }
    if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
      if ((reserve0USD * 2) < BigNumber.from(MINIMUM_USD_THRESHOLD_NEW_PAIRS).toNumber()) {
        return ZERO_BD
      }
    }
    if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if ((reserve1USD * 2) < BigNumber.from(MINIMUM_USD_THRESHOLD_NEW_PAIRS).toNumber()) {
        return ZERO_BD
      }
    }
  }

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(BigDecimal.fromString(price0.toString()))
      .plus(tokenAmount1.times(BigDecimal.fromString(price1.toString())))
      .div(BigDecimal.fromString('2'))
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(BigDecimal.fromString(price0.toString()))
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(BigDecimal.fromString(price1.toString()))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export async function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token
): Promise<BigDecimal> {
  let bundle = await Bundle.get('1')
  let price0 = token0.derivedETH * bundle.ethPrice
  let price1 = token1.derivedETH * bundle.ethPrice

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(BigDecimal.fromString(price0.toString()))
      .plus(tokenAmount1.times(BigDecimal.fromString(price1.toString())))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(BigDecimal.fromString(price0.toString()))
      .times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1
      .times(BigDecimal.fromString(price1.toString()))
      .times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}
