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
  '{{ factory_address }}{{^factory_address}}0x0000000000000000000000000000000000000000{{/factory_address}}'

export const ZLK_TOKEN_ADDRESS = 
  '{{ zlk_address }}{{^zlk_address}}0x0000000000000000000000000000000000000000{{/zlk_address}}'

export const WETH_USDC_PAIR =
  '{{ weth_usdc_pair }}{{^weth_usdc_pair}}0x0000000000000000000000000000000000000000{{/weth_usdc_pair}}'

export const WETH_ADDRESS = 
  '{{ weth_address }}{{^weth_address}}0x0000000000000000000000000000000000000000{{/weth_address}}'

export const USDC_ADDRESS = 
  '{{ usdc_address }}{{^usdc_address}}0x0000000000000000000000000000000000000000{{/usdc_address}}'

export const FARMING_ADDRESS =
  '{{ farming_address }}{{^farming_address}}0x0000000000000000000000000000000000000000{{/farming_address}}'

export const WHITELIST: string[] = '{{ whitelist }}'.split(',')
