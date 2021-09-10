import { MythicInfo, fetchMythics } from './api/mythics'
import { format as ts } from 'timeago.js'

export async function getStaticProps(num) {
  const data = await fetchMythics(num)
  return {
    props: {
      mythics: data.mythics,
      lastUpdate: data.lastUpdate,
    },
    revalidate: 300,
  }
}

interface Props {
  mythics: MythicInfo[]
  lastUpdate: string
}

const Mythic = ({ mythic }: { mythic: MythicInfo }) => {
  return (
    <a href={mythic.url} target="_blank">
      <div className="m-auto pb-4 mb-8 flex flex-col justify-center items-center gap-2 p-4 md:m-4 border border-white transform hover:scale-105 transition-all bg-black w-full md:w-96">
        <img src={mythic.svg} alt="" width="350" height="350" />
        <div className="text-center">
          <p className="text-lg">#{mythic.id}</p>
          <p>{mythic.price} ETH</p>
        </div>
      </div>
    </a>
  )
}

const IndexPage = ({ mythics, lastUpdate }: Props) => {
  return (
    <div className="py-3 md:pb-0 font-mono flex flex-col justify-center items-center gap-4 pt-10 md:w-screen">
      <h1 className="text-lg md:text-3xl">Mythics</h1>
      <div className="text-center max-w-screen-md md:leading-loose">
        <p className="md:text-xl">
          There are {mythics.length} bags for sale with 3 Mythics. The floor
          price is {mythics[0].price} ETH.
        </p>
        <p className="md:text-lg pt-2">
          Site by{' '}
          <a
            target="_blank"
            href="https://twitter.com/tonylongname"
            className="underline"
          >
            tonylongname
          </a>
          . Based off robes.market by {' '}
          <a
            target="_blank"
            href="https://twitter.com/worm_emoji"
            className="underline"
          >
            worm_emoji
          </a>
          . Join the Mythic Guild{' '}
          <a
            target="_blank"
            className="underline"
            href="https://discord.gg/HgXSVtfD"
          >
            Discord
          </a>
          .
        </p>
        <p className="text-sm mv-4">Last updated {ts(lastUpdate)}</p>
      </div>
      <div className="grid md:grid-cols-2 pt-5">
        {mythics.map((mythic) => {
          return <Mythic mythic={mythic} key={mythic.id} />
        })}
      </div>
    </div>
  )
}

export default IndexPage
