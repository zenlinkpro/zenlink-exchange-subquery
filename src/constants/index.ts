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
  '0xF49255205Dfd7933c4D0f25A57D40B1511F92fEF'

export const ZLK_TOKEN_ADDRESS = 
  '0x3fd9b6c9a24e09f67b7b706d72864aebb439100c'

export const WETH_USDC_PAIR =
  '0x1eb802dfcc9e6d0b553c99c461f27d4000b46cef'

export const WETH_ADDRESS = 
  '0xacc15dc74880c9944775448304b263d191c6077f'

export const USDC_ADDRESS = 
  '0x8f552a71efe5eefc207bf75485b356a0b3f01ec9'

export const FARMING_ADDRESS =
  '0xA226877393fC4e3B5F2B43a1BaE3c5D72C918c2d'

export const WHITELIST: string[] = '0xacc15dc74880c9944775448304b263d191c6077f,0x8f552a71efe5eefc207bf75485b356a0b3f01ec9,0x8e70cd5b4ff3f62659049e74b6649c6603a0e594,0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b,0xefaeee334f0fd1712f9a8cc375f427d9cdd40d73,0x81ecac0d6be0550a00ff064a4f9dd2400585fe9c,0x6a2d262d56735dba19dd70682b39f6be9a931d98,0x30d2a9f5fdf90ace8c17952cbb4ee48a55d916a7,0xfa9343c3897324496a05fc75abed6bac29f8a40f'.split(',')
