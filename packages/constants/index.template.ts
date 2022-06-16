import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')

export const BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')

export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export const BIG_INT_ONE = BigInt.fromI32(1)

export const BIG_INT_TWO = BigInt.fromI32(2)

export const BIG_INT_ONE_HUNDRED = BigInt.fromI32(100)

export const BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400)

export const BIG_INT_ZERO = BigInt.fromI32(0)

export const FACTORY_ADDRESS = Address.fromString(
  '{{ factory_address }}{{^factory_address}}0x0000000000000000000000000000000000000000{{/factory_address}}'
)

export const ZLK_TOKEN_ADDRESS = Address.fromString(
  '{{ zlk_address }}{{^zlk_address}}0x0000000000000000000000000000000000000000{{/zlk_address}}'
)

export const WETH_USDC_PAIR =
  '{{ weth_usdc_pair }}{{^weth_usdc_pair}}0x0000000000000000000000000000000000000000{{/weth_usdc_pair}}'

export const WETH_ADDRESS = Address.fromString(
  '{{ weth_address }}{{^weth_address}}0x0000000000000000000000000000000000000000{{/weth_address}}'
)

export const USDC_ADDRESS = 
  '{{ usdc_address }}{{^usdc_address}}0x0000000000000000000000000000000000000000{{/usdc_address}}'

export const FARMING_ADDRESS = Address.fromString(
  '{{ farming_address }}{{^farming_address}}0x0000000000000000000000000000000000000000{{/farming_address}}'
)

export const WHITELIST: string[] = '{{ whitelist }}'.split(',')
