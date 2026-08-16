jest.mock('notion-client', () => ({
  NotionAPI: jest.fn(() => ({
    getPage: jest.fn().mockResolvedValue({ recordMap: { block: {} } })
  }))
}))

jest.mock('@/blog.config', () => ({
  __esModule: true,
  default: {
    API_BASE_URL: '',
    NOTION_ACTIVE_USER: '',
    NOTION_TOKEN_V2: ''
  }
}))

import { notionAPI } from '@/lib/db/notion/getNotionAPI'
import { NotionAPI as MockNotionAPI } from 'notion-client'

describe('Notion API client', () => {
  it('uses the current endpoint and safely retries transient failures', async () => {
    await notionAPI.getPage('3b2648f922f044e292cd604383f97ace')

    expect(MockNotionAPI).toHaveBeenCalledTimes(1)
    expect(MockNotionAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiBaseUrl: 'https://app.notion.com/api/v3',
        ofetchOptions: {
          headers: {
            'User-Agent': 'NotionNext (+https://github.com/ctipsdev/NotionNext)'
          }
        }
      })
    )

    const getPage = MockNotionAPI.mock.results[0].value.getPage
    getPage
      .mockRejectedValueOnce(new Error('transient Notion failure'))
      .mockResolvedValueOnce({ recordMap: { block: {} } })

    await expect(notionAPI.getPage('transient-page')).rejects.toThrow(
      'transient Notion failure'
    )
    await expect(notionAPI.getPage('transient-page')).resolves.toEqual({
      recordMap: { block: {} }
    })

    expect(getPage).toHaveBeenCalledTimes(3)
  })
})
