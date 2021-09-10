import { NextApiRequest, NextApiResponse } from 'next'
import pMap from 'p-map'
import { chunk, flatten, orderBy } from 'lodash'
import { utils as etherUtils, BigNumber } from 'ethers'
import { rarityImage } from 'loot-rarity'
import type { OpenseaResponse, Asset } from '../../../utils/openseaTypes'
import Mythic5IDs from '../../../data/mythicFives-ids.json'
import Mythic4IDs from '../../../data/mythicFours-ids.json'
import Mythic3IDs from '../../../data/mythicThrees-ids.json'
// import Mythic2IDs from '../../../data/mythicTwos-ids.json'
// import Mythic1IDs from '../../../data/mythicOnes-ids.json'

const chunked5 = chunk(Mythic5IDs, 20)
const chunked4 = chunk(Mythic4IDs, 20)
const chunked3 = chunk(Mythic3IDs, 20)
// const chunked2 = chunk(Mythic2IDs, 20)
// const chunked1 = chunk(Mythic1IDs, 20)

const apiKey = process.env.OPENSEA_API_KEY

const fetchMythicPage = async (ids: string[]) => {
  let url = 'https://api.opensea.io/api/v1/assets?collection=lootproject&'
  url += ids.map((id) => `token_ids=${id}`).join('&')

  const res = await fetch(url, {
    // headers: {
    //   'X-API-KEY': apiKey,
    // },
  })
  const json: OpenseaResponse = await res.json()

  return Promise.all(
    json.assets.map(async (asset) => {
      return {
        ...asset,
        image_url: await rarityImage(asset.token_metadata, {
          colorFn: ({ itemName }) =>
            itemName.toLowerCase().includes('divine robe') && 'cyan',
        }),
      }
    }),
  )
}

interface Props {
  num: number
}

export interface MythicInfo {
  id: string
  price: Number
  url: string
  svg: string
}

function numMythics(x) {
  if (x == 5) {
    return chunked5;
  } else if (x == 4) {
    return chunked4;
  } else {
    return chunked3;
  } 
}

export const fetchMythics = async (num) => {
  const data = await pMap(numMythics(num), fetchMythicPage, { concurrency: 2 })
  const mapped = flatten(data)
    .filter(
      (a: Asset) =>
        a?.sell_orders?.[0]?.payment_token_contract.symbol === 'ETH',
    )
    .map((a: Asset): MythicInfo => {
      return {
        id: a.token_id,
        price: Number(
          etherUtils.formatUnits(
            BigNumber.from(a.sell_orders[0]?.current_price.split('.')[0]),
          ),
        ),
        url: a.permalink + '?ref=0xfb843f8c4992efdb6b42349c35f025ca55742d33',
        svg: a.image_url,
      }
    })

  return {
    mythics: orderBy(mapped, ['price', 'id'], ['asc', 'asc']),
    lastUpdate: new Date().toISOString(),
  }
}

const handler = async (_req: NextApiRequest, res: NextApiResponse, { num }: Props) => {
  try {
    const data = await fetchMythics(num)
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
