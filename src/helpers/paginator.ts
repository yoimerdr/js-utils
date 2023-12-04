import {
  PagePaginatorCommonOptions,
  PagePaginatorOptions, PagePaginatorResponsiveValue
} from "../definitions/helpers/paginator";
import {Nullable, SpanNullableElement, StringNullable} from "../definitions/helpers/utils";
import {ErrorManager} from "./utils";
import {UriQueryItem, UriQueryParameters} from "./uri";
import {LocationManager} from "./window";

export type PageChangeType = "load" | "click"

export class PagePaginator<Options extends PagePaginatorOptions> {
  options: Options;
  currentPage: number = -1;
  constructor(options: PagePaginatorOptions) {
    this.options = options as Options;
    PagePagination.assignPagePaginationOptions(this.options);
    this.options.totalPages = Math.ceil(this.options.total / this.options.perPage);
  }
  pageBuilder(page: number | string, callback?: (span: HTMLSpanElement, anchor: HTMLAnchorElement) => void): SpanNullableElement {
    const item = document.createElement("span");
    let link = document.createElement("a");

    const isNumber = typeof page === "number";
    // set link properties
    if (isNumber)
      item.id = `${this.options.containerId}-page-${page}`;

    link.innerHTML = `${page}`;

    if (callback)
      callback(item, link);

    item.appendChild(link);
    return item;
  }
  getInitialCurrentPage(): number {
    // get current page
    let pageParam = UriQueryParameters.from(location.href).getParameter(this.options.pageParameterName);
    pageParam = Object.orDefault(pageParam, new UriQueryItem(this.options.pageParameterName, "1"));
    return parseInt(pageParam.value);
  }
  pageUrl(page: number | string): StringNullable {
    const queryParams = UriQueryParameters.fromCurrent();
    if(!queryParams)
      return "#";

    if (page !== 1)
      queryParams.set({
        key: this.options.pageParameterName,
        value: `${page}`
      }, true);
    else queryParams.remove(this.options.pageParameterName);

    return queryParams.buildUri();
  }
  getResponsiveValues(): PagePaginatorResponsiveValue[] {
    const keys: PagePaginatorResponsiveValue[] = [];
    for(let key in this.options.responsive) {
      try {
        keys.push({
          key: parseInt(key),
          value: this.options.responsive[key]
        });
      } catch (e) {}
    }
    keys.sort((a, b) => a.key - b.key);
    return keys;
  }
  addMediaQueryResponsive(container: Nullable<HTMLElement>, maxWidth: string | number,
                          onElse?: (paginator: PagePaginator<Options>) => void) {
    if(window && container) {
      window.matchMedia(`(max-width: ${maxWidth}px)`)
        .addEventListener("change", (ev) => {
          if(ev.matches)
            this.paginate(container, this.options.responsive[maxWidth]);
          else if(onElse)
            onElse(this);
        });
    }
  }

  onPageChange(page: number, type: PageChangeType) {
    this.currentPage = page;
    this.options.onPageChange(page, type);
  }

  validateCurrentPage() {
    // check valid page number
    let url: StringNullable = undefined;
    if(this.currentPage < 1) {
      url = this.pageUrl(1);
      this.currentPage = 1;
    }
    else if(this.currentPage > this.options.totalPages) {
      this.currentPage = this.options.totalPages;
      url = this.pageUrl(this.options.totalPages);
    }

    if(url) {
      if(!this.options.reload) {
        this.onPageChange(this.currentPage, "load");
      }
      LocationManager.changeUrl(url, this.options.reload);
    }
  }

  dontReloadPaginate(url: string) {
    const container = document.getElementById(this.options.containerId);
    if(container) {
      const keys = this.getResponsiveValues();

      // find first width matching
      let width = keys.findIndex(r => window.innerWidth <= r.key);
      if(width !== -1)
        width = keys[width].key;

      this.paginate(container, width !== -1 ? this.options.responsive[width] : undefined);
    }
    LocationManager.changeUrl(url, this.options.reload);
  }

  __anchorPageCallback(page: number, link: HTMLAnchorElement): void {
    const url = this.pageUrl(page);
    if(url)
      link.href = url;

    link.title = `${this.options.pageText} ${page}`;

    link.addEventListener("click", (ev) => {
      if(page != this.currentPage) {
        this.onPageChange(page, "click");
        if(!this.options.reload) {
          ev.preventDefault();
          this.dontReloadPaginate(link.href);
        }
      }
    })

  }

  anchorActionPageCallback(page: number, link: HTMLAnchorElement, disable: boolean): void {
    this.__anchorPageCallback(page, link);
  }
  anchorNumberPageCallback(page: number, link: HTMLAnchorElement): void {
    this.__anchorPageCallback(page, link);
  }
  anchorEllipsisPageCallback(link: HTMLAnchorElement) {}
  actionPageBuilder(text: string, page: number, disable: boolean, name?: string): SpanNullableElement {
    return this.pageBuilder(text, (span, link) => {
      // set properties
      span.id = `${this.options.containerId}-${(name || text).toLocaleLowerCase()}-page`;
      if (disable) {
        // add disable css class and clean possibles ref or action
        span.classList.add(this.options.pageDisable);
        link.removeAttribute("href");
      }
      span.classList.add(this.options.actionPage);
      this.anchorActionPageCallback(page, link, disable);
    });
  }
  numberPageBuilder(page: number, active: boolean): SpanNullableElement {
    return this.pageBuilder(page, (span, link) => {
      if (active)
        span.classList.add(this.options.pageActive);
      this.anchorNumberPageCallback(page, link);
    });
  }
  ellipsisPageBuilder(ellipsisName: string): SpanNullableElement {
    return this.pageBuilder(this.options.ellipsisText, (span, link) => {
      span.id = `${this.options.containerId}-${ellipsisName}-page`;
      span.classList.add(this.options.ellipsisPage);
      this.anchorEllipsisPageCallback(link)
    });
  }

  beforePaginate() {
    this.currentPage = this.getInitialCurrentPage();
    if(this.currentPage >= 1 && this.currentPage <= this.options.totalPages) {
      this.onPageChange(this.currentPage, "load");
    }
  }
  paginate(container: Nullable<HTMLElement>, responsive?: PagePaginatorCommonOptions) {
    if(!container)
      return;

    // clean container
    container.innerHTML = "";

    // create pages container
    const pagination = document.createElement("div");
    const { options: config } = this;

    pagination.id = config.containerPagesId;

    function appendToPagination(element: SpanNullableElement) {
      if(Object.isValidType(element))
        pagination.appendChild(element!);
    }

    // check current page value
    this.validateCurrentPage();

    // add previous button
    appendToPagination(this.actionPageBuilder(config.previous, this.currentPage - 1, this.currentPage === 1, "previous"));

    // extract common options
    let { alwaysShow, showPages, showEllipsis } = config;

    if(Object.isObject(responsive)) {
      Object.assignIfNotPresent(responsive!, {
        alwaysShow: 1,
        showPages: 3,
        showEllipsis: false
      })

      alwaysShow = responsive!.alwaysShow;
      showPages = responsive!.showPages;
      showEllipsis = responsive!.showEllipsis;
    }

    // set to absolute value for avoid errors
    config.totalPages = Math.abs(config.totalPages);
    alwaysShow = Math.abs(alwaysShow);
    showPages = Math.abs(showPages)

    // add n start numbers
    for(let i = 1; i <= alwaysShow && i <= config.totalPages; ++i)
      appendToPagination(this.numberPageBuilder(i, this.currentPage === i));

    if(config.totalPages !== 1) {
      // calculate start and ends page numbers
      const floor = Math.floor(showPages / 2);
      let start = Math.max(alwaysShow + 1, this.currentPage - floor);
      let end = Math.min(config.totalPages - alwaysShow, this.currentPage + floor);

      // check pages number
      let pages = end - start;
      if(pages < showPages) {
        pages = showPages - (pages + 1);
        if(this.currentPage > config.totalPages / 2)
          start = start - pages;
        else end = end + pages;
      }

      if(start === 1 && alwaysShow > 0)
        start++;
      if (end > config.totalPages)
        end = config.totalPages;

      // add first ellipsis (left)
      if(showEllipsis && start > alwaysShow + 1)
        appendToPagination(this.ellipsisPageBuilder("first-ellipsis"));

      // add n page numbers (center)
      for (let i = start, j = 0; j < showPages && i <= end; i++, ++j)
        appendToPagination(this.numberPageBuilder(i, i === this.currentPage));

      // add last ellipsis (right)
      if (showEllipsis && start + showPages < config.totalPages - alwaysShow + 1)
        appendToPagination(this.ellipsisPageBuilder("last-ellipsis"))

      // add n last numbers
      for (let i = (config.totalPages - alwaysShow) + 1; i <= config.totalPages; ++i)
        appendToPagination(this.numberPageBuilder(i, i === this.currentPage));
    }

    // next button
    appendToPagination(this.actionPageBuilder(config.next, this.currentPage + 1, this.currentPage === config.totalPages, "next"))

    container.appendChild(pagination);
  }
}

export class PagePagination {
  static assignPagePaginationOptions(options: PagePaginatorOptions) {
    Object.assignIfNotPresent(options, {
      total: 1,
      totalPages: 0,
      perPage: 1,
      showPages: 2,
      alwaysShow: 1,
      containerId: "page-pagination",
      containerPagesId: "page-pagination-pages",
      pageActive: "page-pagination-current",
      pageDisable: "page-pagination-disabled",
      ellipsisPage: "page-pagination-ellipsis",
      actionPage: "page-pagination-action",
      pageParameterName: "page",
      previous: "<",
      next: ">",
      ellipsisText: "...",
      pageText: "Page",
      responsive: {},
      showEllipsis: true,
      reload: false,
      onPageChange(page: number) {}
    });
  }
  static paginate<Options extends PagePaginatorOptions>(paginator?: PagePaginator< Options> | Options) {
    // try catch block
    ErrorManager.manage(() => {
      // check if document and location are valid
      if(typeof document === "undefined" || typeof location === "undefined")
        return;

      // check paginator
      if(!(paginator instanceof PagePaginator)) {
        console.log("Using default paginator");
        paginator = new PagePaginator(paginator as PagePaginatorOptions);
      }

      paginator = Object.orDefault(paginator, new PagePaginator({} as PagePaginatorOptions));
      const config = paginator.options;

      // check paginator container
      const container = document.getElementById(config.containerId);
      if(!container) {
        console.log(`Container with id ${config.containerId} invalid`);
        return;
      }

      // pixels array for responsive
      const keys = paginator.getResponsiveValues();
      let key: number = -1;

      // add responsive listeners
      if(Object.isObject(window)) {

        // check if there are responsive values
        if(!keys.isEmpty()) {
          // listener for media query

          // add listeners
          for (let i = 0; i < keys.length - 1; ++i) {
            const current = keys[i];
            const next = keys[i + 1];
            if(key === -1) {
              if (window.innerWidth <= current.key)
                key = current.key;
              else if(window.innerWidth <= next.key)
                key = next.key;
            }
            paginator.addMediaQueryResponsive(container, current.key, p => p.paginate(container, next.value));
          }

          // check last element
          let width = keys[keys.length - 1].key;
          if (window.innerWidth <= width && width === -1)
            key = width;

          // to the last add change to normal pagination
          paginator.addMediaQueryResponsive(container, width, p => p.paginate(container));
        }
      }
      paginator.beforePaginate();
      paginator.paginate(container, key !== -1 ? config.responsive[key] : undefined);
      console.log(`Paginated successfully.`);
    }, "page pagination");

  }
}