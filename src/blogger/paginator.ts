import {BloggerOptions, BloggerPageType} from "../definitions/blogger/blogger";
import {BlogPaginatorOptions, } from "../definitions/blogger/paginator";
import {PageChangeType, PagePagination, PagePaginator} from "../helpers/paginator";
import {UriQueryItem, UriQueryParameters} from "../helpers/uri";
import {Blogger, BloggerQueryParamsBuilder} from "./blogger";
import {Nullable, StringNullable, UriQueryParam} from "../definitions/helpers/utils";
import {LocationManager} from "../helpers/window";

export type BlogPaginatorPageType = BloggerPageType | "search"

export class BlogPagePaginator extends PagePaginator<BlogPaginatorOptions> {

  labels: string[] = []
  constructor(options: BlogPaginatorOptions, public pageType: BlogPaginatorPageType, labels?: string[], assignDefault?: boolean) {
    const config = options as BlogPaginatorOptions
    if(assignDefault)
      BlogPagination.assignDefaultOptions(config);
    super(config);
    if(labels)
      this.labels = labels;
  }

  onPageChange(page: number, type: PageChangeType) {
    super.onPageChange(page, type);
    if(this.options.reload)
      this.reloadPageContent(page, type);
    else if (type === "load")
      this.fetchPageContent(page)
  }

  dontReloadPaginate(url: string) {
    const queryParameters = UriQueryParameters.from(url)
    const page = queryParameters.getParameter(this.options.pageParameterName);
    if(!page) {
      super.dontReloadPaginate(url);
      return;
    }

    this.fetchPageContent(parseInt(page.value), queryParameters, () => super.dontReloadPaginate(url))
  }

  pageUrl(page: number | string): StringNullable {
    return this.options.reload ? undefined : super.pageUrl(page);
  }

  __fetchPageContent(page: number) {

    const config = this.options;
    let index = (page - 1) * config.perPage;

    if(!config.reload)
      index++

    if(index < 1)
      index = 1;

    const params: UriQueryParam[]  = [
      {
        key: "start-index",
        value: `${index}`
      }
    ]

    if(this.pageType === "search") {
      const param = BloggerQueryParamsBuilder.labelSearch(this.labels)
      if(param)
        params.push(param)
    } else params.push(BloggerQueryParamsBuilder.maxResult(config.reload ? 1 : config.perPage))

    return Blogger.fetchFeed({
      fetch: {
        params: params
      }
    } as BloggerOptions);
  }

  fetchPageContent(page: number, queryParams?: Nullable<UriQueryParameters>, callback?: () => void) {
    queryParams = Object.orDefault(queryParams, UriQueryParameters.fromCurrent());
    if(!queryParams)
      return;

    // check values
    this.options.beforeFetchContent();
    // call fetch to use on change page callback
    this.__fetchPageContent(page)
      .then(blog => {
        this.options.afterFetchContent(blog.entries);
        if(callback)
          callback();
      })
      .catch(err => console.log(`An errors occurs in pagination ${this.pageType} - ${page}: ${err}`));
  }

  reloadPageContent(page: number, type?: PageChangeType) {

    const config = this.options;
    // build params switch page type
    const searchLabel = `${config.searchLabelPath}/${Object.orDefault(this.labels[0], "")}`;
    const pageParam = new UriQueryItem(this.options.pageParameterName, `${page}`);
    const queryParams =  UriQueryParameters.from(this.pageType == "page" ? config.searchPath : searchLabel);

    if(page === 1) {
      if(type === "click" || location.href.includes(pageParam.valueOf()))
        LocationManager.changeUrl(this.pageType === "page" ? "/" : searchLabel);
      return;
    }

    this.__fetchPageContent(page)
      .then(blog => {
        // check if location is defined
        if(typeof location === "undefined")
          return;

        if(!blog.entries.isEmpty()) {
          // format date to valid query parameter
          const published = blog.entries[0].published.replace(/[.][0-9]{3,}-/g, "-");
          queryParams.push({
            key: "updated-max",
            value: `${published}`
          })
        }
        queryParams.extend([
          BloggerQueryParamsBuilder.maxResult(config.perPage),
          pageParam
        ])

        // change location
        const url = queryParams.buildUri();
        if(!location.href.includes(url))
          LocationManager.changeUrl(url);
      })
      .catch(err => console.log(`An errors occurs in pagination ${this.pageType} - ${page}: ${err}`));
  }

}

export class BlogPagination {

  static assignDefaultOptions(options: BlogPaginatorOptions) {
    const blogger = {} as BloggerOptions;
    Blogger.assignDefaultOptions(blogger);
    Object.assignIfNotPresent(options, {
      searchLabelPath: "/search/label",
      searchPath: "/search",
      currentPage: "/",
      containerId: "blog-pager",
      postsContainerSelector: ".blog-posts",
      reload: true,
      perPage: 12,
      getPostsContainer(): Nullable<Element> {
        if(!document || !this.postsContainerSelector)
          return;

        return document.querySelector(this.postsContainerSelector);
      },
      afterFetchContent<Ty>(posts: Ty[]) {

      },
      beforeFetchContent() {
      },
      blogger: blogger
    } as BlogPaginatorOptions)
    PagePagination.assignPagePaginationOptions(options);
  }

  static paginate(options?: BlogPaginatorOptions) {
    // validate location
    const isInBrowser = typeof location !== "undefined";
    if(!isInBrowser)
      return;

    const config = Object.orDefault(options, {} as BlogPaginatorOptions) as BlogPaginatorOptions;
    BlogPagination.assignDefaultOptions(config)

    // check location url
    if((config.currentPage.isEmpty() || config.currentPage === "/"))
      config.currentPage = location.href;

    // check blog url
    if((config.blogger.blogUrl.isEmpty() || config.blogger.blogUrl === "/") && isInBrowser)
      config.blogger.blogUrl = location.origin;

    const type = config.currentPage.includes(config.searchLabelPath) ? "search" : "page";


    const parameters: UriQueryParam[] = []
    let labels: string[] = [];

    // get search label
    if(type === "search") {
      const queryParams = UriQueryParameters.fromCurrent();
      if(!config.reload && queryParams) {
        const categories = queryParams.getParameter("categories");
        if (categories)
          labels = categories.key.split(",");
      }
      else if(queryParams) {
        const url = queryParams.getBaseUrl();
        labels = [decodeURIComponent(url.substring(url.lastIndexOf("/") + 1))]
      }
      const param =  BloggerQueryParamsBuilder.labelSearch(labels)
      if(param)
        parameters.push(param)
    } else parameters.push(BloggerQueryParamsBuilder.maxResult(1))

    Blogger.fetchFeed({
      fetch: {
        params: parameters
      },
    } as BloggerOptions).then(blog => {
      config.total = blog.total;
      const paginator = new BlogPagePaginator(config, type, labels,false);
      // generate pages
      PagePagination.paginate(paginator);
    });

  }
}