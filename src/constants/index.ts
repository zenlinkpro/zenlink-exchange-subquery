import BigDecimal from 'bignumber.js'
import { BigNumber } from 'ethers'

export const NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000'

export const BIG_DECIMAL_1E6 = new BigDecimal('1e6')

export const BIG_DECIMAL_1E12 = new BigDecimal('1e12')

export const BIG_DECIMAL_1E18 = new BigDecimal('1e18')

export const BIG_DECIMAL_ZERO = new BigDecimal('0')

export const BIG_DECIMAL_ONE = new BigDecimal('1')

export const BIG_INT_ONE = BigNumber.from(1)

export const BIG_INT_TWO = BigNumber.from(2)

export const BIG_INT_ONE_HUNDRED = BigNumber.from(100)

export const BIG_INT_ONE_DAY_SECONDS = BigNumber.from(86400)

export const BIG_INT_ZERO = BigNumber.from(0)

export const FACTORY_ADDRESS = 
  '0xf36AE63d89983E3aeA8AaaD1086C3280eb01438D'

export const ZLK_TOKEN_ADDRESS = 
  '0x0f47ba9d9Bde3442b42175e51d6A367928A1173B'

export const WETH_USDC_PAIR =
  '0x042e54b2b28265a7ce171f97391334bd47fe384c'

export const WETH_ADDRESS = 
  '0x98878b06940ae243284ca214f92bb71a2b032b8a'

export const USDC_ADDRESS = 
  '0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d'

export const FARMING_ADDRESS =
  '0xAfaFf19679ab6baF75eD8098227Be189BA47ba0F'

export const WHITELIST: string[] = '0x98878b06940ae243284ca214f92bb71a2b032b8a,0xe3f5a90f9cb311505cd691a46596599aa1a0ad7d,0x639a647fbe20b6c8ac19e48e2de44ea792c62c5c,0xffffffff1fcacbd218edc0eba20fc2308c778080,0xffffffff893264794d9d57e1e0e21e0042af5a0a'.split(',')
