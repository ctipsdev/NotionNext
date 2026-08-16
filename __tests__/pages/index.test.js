jest.mock('@/blog.config', () => ({
  __esModule: true,
  default: {
    THEME: 'simple',
    NEXT_REVALIDATE_SECOND: 60
  }
}))

jest.mock('@/lib/config', () => ({
  siteConfig: jest.fn((key, fallback) => fallback)
}))

jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn(),
  getPostBlocks: jest.fn()
}))

jest.mock('@/lib/utils/robots.txt', () => ({
  generateRobotsTxt: jest.fn()
}))

jest.mock('@/lib/utils/rss', () => ({
  generateRss: jest.fn()
}))

jest.mock('@/lib/utils/sitemap.xml', () => ({
  generateSitemapXml: jest.fn()
}))

jest.mock('@/lib/utils/redirect', () => ({
  generateRedirectJson: jest.fn()
}))

jest.mock('@/lib/plugins/algolia', () => ({
  checkDataFromAlgolia: jest.fn()
}))

jest.mock('@/themes/theme', () => ({
  DynamicLayout: () => null
}))

import { getStaticProps } from '@/pages/index'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { generateRobotsTxt } from '@/lib/utils/robots.txt'
import { generateRss } from '@/lib/utils/rss'
import { generateSitemapXml } from '@/lib/utils/sitemap.xml'
import { generateRedirectJson } from '@/lib/utils/redirect'
import { checkDataFromAlgolia } from '@/lib/plugins/algolia'

describe('home page static props', () => {
  const originalLifecycleEvent = process.env.npm_lifecycle_event

  beforeEach(() => {
    fetchGlobalAllData.mockResolvedValue({
      allPages: [
        {
          id: 'post-id',
          slug: 'article/post-id',
          status: 'Published',
          type: 'Post'
        }
      ],
      NOTION_CONFIG: {}
    })
  })

  afterAll(() => {
    if (originalLifecycleEvent === undefined) {
      delete process.env.npm_lifecycle_event
    } else {
      process.env.npm_lifecycle_event = originalLifecycleEvent
    }
  })

  it('does not run filesystem generators during ISR', async () => {
    process.env.npm_lifecycle_event = 'start'

    await getStaticProps({ locale: 'zh-CN' })

    expect(generateRobotsTxt).not.toHaveBeenCalled()
    expect(generateRss).not.toHaveBeenCalled()
    expect(generateSitemapXml).not.toHaveBeenCalled()
    expect(generateRedirectJson).not.toHaveBeenCalled()
    expect(checkDataFromAlgolia).not.toHaveBeenCalled()
  })

  it('still runs generators during a production build', async () => {
    process.env.npm_lifecycle_event = 'build'

    await getStaticProps({ locale: 'zh-CN' })

    expect(generateRobotsTxt).toHaveBeenCalledTimes(1)
    expect(generateRss).toHaveBeenCalledTimes(1)
    expect(generateSitemapXml).toHaveBeenCalledTimes(1)
    expect(checkDataFromAlgolia).toHaveBeenCalledTimes(1)
  })
})
