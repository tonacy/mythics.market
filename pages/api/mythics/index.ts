import { NextApiRequest, NextApiResponse } from 'next'
import pMap from 'p-map'
import { chunk, flatten, orderBy } from 'lodash'
import { utils as etherUtils, BigNumber } from 'ethers'
import { rarityImage } from 'loot-rarity'
import type { OpenseaResponse, Asset } from '../../../utils/openseaTypes'
import Mythic4IDs from '../../../data/mythicFours-ids.json'

const chunked = chunk(Mythic4IDs, 20)
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

export interface MythicInfo {
  id: string
  price: Number
  url: string
  svg: string
}

export const fetchMythics = async () => {
  const data = await pMap(chunked, fetchMythicPage, { concurrency: 2 })
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

const handler = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await fetchMythics()
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
