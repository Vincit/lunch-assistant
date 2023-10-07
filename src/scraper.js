import fetch from 'node-fetch';
import cheerio from 'cheerio'
import he from 'he'

export const scrape = async () => {
  const date = process.argv[2] ?? '2023-10-02'

  const url = 'https://www.compass-group.fi/menuapi/week-menus?costCenter=3024&date='+date+'T09%3A18%3A46.441Z&language=fi';
  return fetch(url)
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`)
    }
    return response.json()
  })
  .then((data) => {
    if (data.menus) {
        return data.menus.map((day, idx) => {
          if (idx < 5) {
            const parts = day.html.split('\n')

            const cleanedParts = parts
              .filter(val => val !== '<p>&nbsp;</p>')
              .map((part) => {
                const $ = cheerio.load(part)
                const text = $.text()
                const decodedText = he.decode(text)
                return decodedText
              })

            return cleanedParts
          }
          return ['UIINA']
        })
    }
  })
  .catch((error) => {
    console.error('Fetch Error:', error)
  })

}

