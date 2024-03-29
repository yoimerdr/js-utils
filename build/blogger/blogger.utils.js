// Object utils functions
if (!Object.isObject) {
    Object.isObject = (value) => Object.isValidType(value) && typeof value === "object";
}
if (!Object.isFunction) {
    Object.isFunction = (value) => typeof value === "function";
}
if (!Object.isString) {
    Object.isString = (value) => typeof value === "string";
}
if (!Object.isNumber) {
    Object.isNumber = (value) => typeof value === "number";
}
if (!Object.isValidType) {
    Object.isValidType = function (value) {
        const type = typeof value;
        return type !== "undefined" && value !== null;
    };
}
if (!Object.orDefault) {
    Object.orDefault = function (value, defaultValue) {
        return value || defaultValue;
    };
}
if (!Object.assignIfNotPresent) {
    Object.assignIfNotPresent = function (target, source) {
        if (!Object.isObject(source) || !Object.isObject(target))
            return;
        for (let key in source) {
            if (target.hasOwnProperty(key)) {
                if (Object.isObject(target[key]) && Object.isObject(source[key]) && target[key].constructor === {}.constructor)
                    Object.assignIfNotPresent(target[key], source[key]);
            }
            else
                target[key] = source[key];
        }
    };
}
if (!Object.getPropertyValue) {
    Object.getPropertyValue = function (source, key) {
        if (typeof source !== "object")
            return undefined;
        const { [key]: value } = source;
        return value;
    };
}
// Array util functions
if (!Array.prototype.isEmpty) {
    Array.prototype.isEmpty = function () { return this.length === 0; };
}
// String util functions
if (!String.prototype.isEmpty) {
    String.prototype.isEmpty = function () { return this.length === 0; };
}
class ErrorManager {
    // util function for try catch block
    static manage(callback, type) {
        try {
            callback();
        }
        catch (e) {
            console.log(`An error occurs while run ${Object.isValidType(type) ? type : callback.name}: ${e}`);
        }
    }
}

class UriQueryItem {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
    toString() {
        return `${this.key.trim()}=${encodeURIComponent(this.value)}`;
    }
    valueOf() {
        return this.toString();
    }
}
// class for extract query string parameters from a url.
class UriQueryParameters {
    constructor(url) {
        this.url = url;
        this.items = UriQueryParameters.getParametersFrom(this.url);
        if (!this.items.isEmpty())
            this.url = this.url.substring(0, this.url.indexOf("?"));
    }
    static from(url) { return new UriQueryParameters(url); }
    static fromCurrent() { return typeof location !== "undefined" ? UriQueryParameters.from(location.href) : undefined; }
    static getParametersFrom(url) {
        url = Object.orDefault(url, "");
        if (url.isEmpty())
            return [];
        const start = url.indexOf("?");
        const queries = url.substring(start === -1 ? 0 : start + 1).split("&");
        const items = [];
        queries.forEach(it => {
            const query = it.split("=");
            if (query.length === 2)
                items.push(new UriQueryItem(query[0], decodeURIComponent(query[1])));
        });
        return items;
    }
    __validateParam(param) {
        // check if param is an object
        if (!Object.isObject(param)) {
            console.log(`Invalid query param:`);
            console.log(param);
            return false;
        }
        // assign default values
        Object.assignIfNotPresent(param, {
            key: "",
            value: ""
        });
        // check if values are default
        if (param.key.toString().isEmpty() || param.value.toString().isEmpty()) {
            console.log("Invalid query param values");
            console.log(param);
            return false;
        }
        return true;
    }
    push(param) {
        if (!this.__validateParam(param))
            return this;
        // find existing item with same values, push if not present
        const item = new UriQueryItem(param.key, param.value);
        if (this.items.findIndex(it => it.key === item.key) === -1)
            this.items.push(item);
        return this;
    }
    set(param, push) {
        if (!this.__validateParam(param))
            return this;
        const index = this._getIndexOf(param.key);
        if (index !== -1)
            this.items[index].value = param.value;
        else if (Object.orDefault(push, false))
            this.items.push(new UriQueryItem(param.key, param.value));
        return this;
    }
    remove(key) {
        if (!Object.isValidType(key))
            return this;
        const index = this._getIndexOf(key.toString());
        if (index !== -1)
            this.items.splice(index, 1);
        return this;
    }
    extend(params) {
        Object.orDefault(params, [])
            .forEach(it => this.push(it));
        return this;
    }
    getParameters() {
        return this.items;
    }
    _getIndexOf(key) {
        if (!Object.isValidType(key))
            return -1;
        return this.items.findIndex(it => it.key === key);
    }
    getParameter(key) {
        const index = this._getIndexOf(key.toString());
        if (index === -1)
            return undefined;
        return this.items[index];
    }
    contains(key) {
        return this._getIndexOf(key) != -1;
    }
    buildUri() {
        if (this.items.isEmpty())
            return this.getBaseUrl();
        return `${this.url}?${this.items.join("&")}`;
    }
    getBaseUrl() {
        return this.url;
    }
}
class UriUtils {
    static clean(url) {
        // Remove consecutive slashes in the pathname
        return url.replace(/\/{2,}/g, (text, index) => {
            if (typeof index === "number" && index > 0 && url[index - 1] === ":")
                return text;
            return "/";
        });
    }
}

class LocationManager {
    static changeUrl(url, reload = true) {
        if (!url || !location)
            return;
        if (reload)
            location.href = url;
        else if (history)
            history.pushState({}, "", url);
    }
}

class PagePaginator {
    constructor(options) {
        this.currentPage = -1;
        this.options = options;
        PagePagination.assignPagePaginationOptions(this.options);
        this.options.totalPages = Math.ceil(this.options.total / this.options.perPage);
    }
    pageBuilder(page, callback) {
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
    getInitialCurrentPage() {
        // get current page
        let pageParam = UriQueryParameters.from(location.href).getParameter(this.options.pageParameterName);
        pageParam = Object.orDefault(pageParam, new UriQueryItem(this.options.pageParameterName, "1"));
        return parseInt(pageParam.value);
    }
    pageUrl(page) {
        const queryParams = UriQueryParameters.fromCurrent();
        if (!queryParams)
            return "#";
        if (page !== 1)
            queryParams.set({
                key: this.options.pageParameterName,
                value: `${page}`
            }, true);
        else
            queryParams.remove(this.options.pageParameterName);
        return queryParams.buildUri();
    }
    getResponsiveValues() {
        const keys = [];
        for (let key in this.options.responsive) {
            try {
                keys.push({
                    key: parseInt(key),
                    value: this.options.responsive[key]
                });
            }
            catch (e) { }
        }
        keys.sort((a, b) => a.key - b.key);
        return keys;
    }
    addMediaQueryResponsive(container, maxWidth, onElse) {
        if (window && container) {
            window.matchMedia(`(max-width: ${maxWidth}px)`)
                .addEventListener("change", (ev) => {
                if (ev.matches)
                    this.paginate(container, this.options.responsive[maxWidth]);
                else if (onElse)
                    onElse(this);
            });
        }
    }
    onPageChange(page, type) {
        this.currentPage = page;
        this.options.onPageChange(page, type);
    }
    validateCurrentPage() {
        // check valid page number
        let url = undefined;
        if (this.currentPage < 1) {
            url = this.pageUrl(1);
            this.currentPage = 1;
        }
        else if (this.currentPage > this.options.totalPages) {
            this.currentPage = this.options.totalPages;
            url = this.pageUrl(this.options.totalPages);
        }
        if (url) {
            if (!this.options.reload) {
                this.onPageChange(this.currentPage, "load");
            }
            LocationManager.changeUrl(url, this.options.reload);
        }
    }
    dontReloadPaginate(url) {
        const container = document.getElementById(this.options.containerId);
        if (container) {
            const keys = this.getResponsiveValues();
            // find first width matching
            let width = keys.findIndex(r => window.innerWidth <= r.key);
            if (width !== -1)
                width = keys[width].key;
            this.paginate(container, width !== -1 ? this.options.responsive[width] : undefined);
        }
        LocationManager.changeUrl(url, this.options.reload);
    }
    __anchorPageCallback(page, link) {
        const url = this.pageUrl(page);
        if (url)
            link.href = url;
        link.title = `${this.options.pageText} ${page}`;
        link.addEventListener("click", (ev) => {
            if (page != this.currentPage) {
                this.onPageChange(page, "click");
                if (!this.options.reload) {
                    ev.preventDefault();
                    this.dontReloadPaginate(link.href);
                }
            }
        });
    }
    anchorActionPageCallback(page, link, disable) {
        this.__anchorPageCallback(page, link);
    }
    anchorNumberPageCallback(page, link) {
        this.__anchorPageCallback(page, link);
    }
    anchorEllipsisPageCallback(link) { }
    actionPageBuilder(text, page, disable, name) {
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
    numberPageBuilder(page, active) {
        return this.pageBuilder(page, (span, link) => {
            if (active)
                span.classList.add(this.options.pageActive);
            this.anchorNumberPageCallback(page, link);
        });
    }
    ellipsisPageBuilder(ellipsisName) {
        return this.pageBuilder(this.options.ellipsisText, (span, link) => {
            span.id = `${this.options.containerId}-${ellipsisName}-page`;
            span.classList.add(this.options.ellipsisPage);
            this.anchorEllipsisPageCallback(link);
        });
    }
    beforePaginate() {
        this.currentPage = this.getInitialCurrentPage();
        if (this.currentPage >= 1 && this.currentPage <= this.options.totalPages) {
            this.onPageChange(this.currentPage, "load");
        }
    }
    paginate(container, responsive) {
        if (!container)
            return;
        // clean container
        container.innerHTML = "";
        // create pages container
        const pagination = document.createElement("div");
        const { options: config } = this;
        pagination.id = config.containerPagesId;
        function appendToPagination(element) {
            if (Object.isValidType(element))
                pagination.appendChild(element);
        }
        // check current page value
        this.validateCurrentPage();
        // add previous button
        appendToPagination(this.actionPageBuilder(config.previous, this.currentPage - 1, this.currentPage === 1, "previous"));
        // extract common options
        let { alwaysShow, showPages, showEllipsis } = config;
        if (Object.isObject(responsive)) {
            Object.assignIfNotPresent(responsive, {
                alwaysShow: 1,
                showPages: 3,
                showEllipsis: false
            });
            alwaysShow = responsive.alwaysShow;
            showPages = responsive.showPages;
            showEllipsis = responsive.showEllipsis;
        }
        // set to absolute value for avoid errors
        config.totalPages = Math.abs(config.totalPages);
        alwaysShow = Math.abs(alwaysShow);
        showPages = Math.abs(showPages);
        // add n start numbers
        for (let i = 1; i <= alwaysShow && i <= config.totalPages; ++i)
            appendToPagination(this.numberPageBuilder(i, this.currentPage === i));
        if (config.totalPages !== 1) {
            // calculate start and ends page numbers
            const floor = Math.floor(showPages / 2);
            let start = Math.max(alwaysShow + 1, this.currentPage - floor);
            let end = Math.min(config.totalPages - alwaysShow, this.currentPage + floor);
            // check pages number
            let pages = end - start;
            if (pages < showPages) {
                pages = showPages - (pages + 1);
                if (this.currentPage > config.totalPages / 2)
                    start = start - pages;
                else
                    end = end + pages;
            }
            if (start === 1 && alwaysShow > 0)
                start++;
            if (end > config.totalPages)
                end = config.totalPages;
            // add first ellipsis (left)
            if (showEllipsis && start > alwaysShow + 1)
                appendToPagination(this.ellipsisPageBuilder("first-ellipsis"));
            // add n page numbers (center)
            for (let i = start, j = 0; j < showPages && i <= end; i++, ++j)
                appendToPagination(this.numberPageBuilder(i, i === this.currentPage));
            // add last ellipsis (right)
            if (showEllipsis && start + showPages < config.totalPages - alwaysShow + 1)
                appendToPagination(this.ellipsisPageBuilder("last-ellipsis"));
            // add n last numbers
            for (let i = (config.totalPages - alwaysShow) + 1; i <= config.totalPages; ++i)
                appendToPagination(this.numberPageBuilder(i, i === this.currentPage));
        }
        // next button
        appendToPagination(this.actionPageBuilder(config.next, this.currentPage + 1, this.currentPage === config.totalPages, "next"));
        container.appendChild(pagination);
    }
}
class PagePagination {
    static assignPagePaginationOptions(options) {
        Object.assignIfNotPresent(options, {
            total: 0,
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
            onPageChange(page) { }
        });
    }
    static paginate(paginator) {
        // try catch block
        ErrorManager.manage(() => {
            // check if document and location are valid
            if (typeof document === "undefined" || typeof location === "undefined")
                return;
            // check paginator
            if (!(paginator instanceof PagePaginator)) {
                console.log("Using default paginator");
                paginator = new PagePaginator(paginator);
            }
            paginator = Object.orDefault(paginator, new PagePaginator({}));
            const config = paginator.options;
            // check paginator container
            const container = document.getElementById(config.containerId);
            if (!container) {
                console.log(`Container with id ${config.containerId} invalid`);
                return;
            }
            // pixels array for responsive
            const keys = paginator.getResponsiveValues();
            let key = -1;
            // add responsive listeners
            if (Object.isObject(window)) {
                // check if there are responsive values
                if (!keys.isEmpty()) {
                    // listener for media query
                    // add listeners
                    for (let i = 0; i < keys.length - 1; ++i) {
                        const current = keys[i];
                        const next = keys[i + 1];
                        if (key === -1) {
                            if (window.innerWidth <= current.key)
                                key = current.key;
                            else if (window.innerWidth <= next.key)
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

class BlogPost {
    constructor() {
        this.title = "";
        this.labels = [];
        this.url = "/";
        this.updated = "";
        this.published = "";
        this._thumbnail = "";
    }
    static assignDefaultOptions(options) {
        Object.assignIfNotPresent(options, {
            targetUrlRel: "alternate",
            collectionThumbnailSize: "s72-c",
            thumbnailSize: "w385-h185-p-k-no-nu",
            emptyThumbnail: "",
            current: {
                labelComponent: "label/",
                labelsSelector: "a[rel=tag]"
            }
        });
    }
    getThumbnail(size, defaultSize) {
        defaultSize = Object.orDefault(defaultSize, BlogPost.config.collectionThumbnailSize);
        size = Object.orDefault(size, BlogPost.config.thumbnailSize);
        let thumb = this._thumbnail.replace(`/${defaultSize}/`, `/${size}/`);
        if (thumb === this._thumbnail)
            thumb = this._thumbnail.replace(`=${defaultSize}`, `=${size}`);
        return thumb;
    }
    howManyLabels(labels) {
        return this.labels.filter(it => labels.includes(it)).length;
    }
    static fromCollection(collection) {
        const { updated, category, media$thumbnail, title, link, published } = collection;
        const post = new BlogPost();
        // map labels
        if (category)
            post.labels = category.map(it => decodeURIComponent(it.term || ""));
        // map target values
        post.updated = updated.$t;
        post.published = published.$t;
        post.title = title.$t;
        // check for default
        post._thumbnail = Object.orDefault(media$thumbnail.url, this.config.emptyThumbnail);
        // map url value
        const target = link.find(it => it.rel === this.config.targetUrlRel);
        if (target)
            post.url = Object.orDefault(target.href, "/");
        return post;
    }
    static fromCurrentPage() {
        if (typeof document === "undefined")
            return new BlogPost();
        BlogPost.assignDefaultOptions(BlogPost.config);
        return BlogPost.fromCollection({
            // map categories (blog labels)
            category: Array.from(document.querySelectorAll(BlogPost.config.current.labelsSelector)).map(it => {
                const url = it.href.split(BlogPost.config.current.labelComponent);
                // a label as request response category item
                let label = {
                    term: "/"
                };
                // check valid split
                if (url.length === 1)
                    return label;
                // check if url has ?
                const find = url[1].indexOf("?");
                if (find === -1)
                    label.term = url[1];
                else
                    label.term = url[1].substring(0, find);
                return label;
            }),
            media$thumbnail: {
                url: "/"
            },
            link: [
                {
                    rel: BlogPost.config.targetUrlRel,
                    href: (document.querySelector("link[rel=canonical]")).href,
                    title: document.title
                }
            ],
            updated: {
                $t: ""
            },
            published: {
                $t: ""
            },
            title: {
                $t: document.title
            }
        });
    }
}
BlogPost.config = {
    targetUrlRel: "alternate",
    collectionThumbnailSize: "s72-c",
    thumbnailSize: "w385-h185-p-k-no-nu",
    emptyThumbnail: "",
    current: {
        labelComponent: "label/",
        labelsSelector: "a[rel=tag]"
    }
};
class RelatedPost {
    constructor(post, currentPost) {
        this.post = post;
        this.count = 0;
        if (post.url !== currentPost.url)
            this.count = post.howManyLabels(currentPost.labels);
    }
    _categoriesInCommon(options) {
        return `${this.count} ` + (this.count === 1 ? options.categoryInCommon : options.categoriesInCommon).trim();
    }
    static assignDefaultOptions(options) {
        Object.assignIfNotPresent(options, {
            containerId: "related-posts",
            itemClass: "related-post",
            thumbnailClass: "related-post-thumbnail",
            titleClass: "related-post-title",
            categoryInCommon: "category in common",
            categoriesInCommon: "categories in common",
            maxRelatedItems: 8,
            afterFetch(content) {
                if (!document || !this.containerId || content.isEmpty())
                    return;
                const container = document.getElementById(this.containerId);
                if (!container)
                    return;
                content.forEach(post => {
                    const item = post.build(this);
                    if (item)
                        container.appendChild(item);
                });
            }
        });
    }
    build(options) {
        if (!document)
            return undefined;
        const container = document.createElement("div");
        container.classList.add(options.itemClass);
        container.innerHTML = `
    <div class="${options.thumbnailClass}">
      <a href="${this.post.url}" target="_blank" title="${this._categoriesInCommon(options)}">
        <img src="${this.post.getThumbnail()}" alt="${this.post.title}" />
        <h2 class="${options.titleClass}">${this.post.title}</h2>
      </a>
    </div>
    `;
        return container;
    }
    static fetchCurrent(options) {
        if (!location)
            return;
        if (Blogger.typeOf(location.href) !== "item")
            return;
        const current = BlogPost.fromCurrentPage();
        const config = Object.orDefault(options, {});
        RelatedPost.assignDefaultOptions(config);
        const param = BloggerQueryParamsBuilder.labelSearch(current.labels);
        Blogger.fetchFeed({
            fetch: {
                params: param ? [param] : []
            }
        })
            .then(blog => {
            const related = blog.entries.map(it => new RelatedPost(it, current))
                .sort((a, b) => {
                if (a.count >= b.count)
                    return -1;
                return 1;
            })
                .slice(0, config.maxRelatedItems);
            config.afterFetch(related);
        })
            .catch(e => console.log(`Error in fetch current related posts: ${e}`));
    }
}

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Blogger {
    static typeOf(uri) {
        return Object.orDefault(uri, "").endsWith(".html") ? "item" : "page";
    }
    static assignDefaultOptions(options) {
        Object.assignIfNotPresent(options, {
            feedUri: "/feeds/posts/summary/",
            blogUrl: "/",
            fetch: {
                params: []
            }
        });
    }
    static fetchFeed(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const config = Object.orDefault(options, {});
            Blogger.assignDefaultOptions(config);
            const queryParams = UriQueryParameters.from(config.feedUri)
                .extend([
                {
                    key: "alt",
                    value: "json"
                }
            ])
                .extend(config.fetch.params);
            const uri = queryParams.buildUri();
            const response = yield fetch(uri, {
                headers: {
                    "Content-Type": "application/json"
                }
            });
            const body = yield response.json();
            return {
                entries: Object.orDefault(body.feed.entry, []).map((it) => BlogPost.fromCollection(it)),
                total: parseInt(body.feed.openSearch$totalResults.$t)
            };
        });
    }
}
class BloggerQueryParamsBuilder {
    static labelSearch(labels) {
        labels = Object.orDefault(labels, []);
        return labels.isEmpty() ? undefined : {
            key: "q",
            value: `label:"${labels.join('" | label:"')}"`
        };
    }
    static maxResult(max) {
        return {
            key: "max-results",
            value: `${max}`
        };
    }
}

class BlogPagePaginator extends PagePaginator {
    constructor(options, pageType, labels, assignDefault) {
        const config = options;
        if (assignDefault)
            BlogPagination.assignDefaultOptions(config);
        super(config);
        this.pageType = pageType;
        this.labels = [];
        if (labels)
            this.labels = labels;
    }
    onPageChange(page, type) {
        super.onPageChange(page, type);
        if (this.options.reload)
            this.reloadPageContent(page, type);
        else if (type === "load")
            this.fetchPageContent(page);
    }
    dontReloadPaginate(url) {
        const queryParameters = UriQueryParameters.from(url);
        const page = queryParameters.getParameter(this.options.pageParameterName);
        if (!page) {
            super.dontReloadPaginate(url);
            return;
        }
        this.fetchPageContent(parseInt(page.value), queryParameters, () => super.dontReloadPaginate(url));
    }
    pageUrl(page) {
        return this.options.reload ? undefined : super.pageUrl(page);
    }
    __fetchPageContent(page) {
        const config = this.options;
        let index = (page - 1) * config.perPage;
        if (!config.reload)
            index++;
        if (index < 1)
            index = 1;
        const params = [
            {
                key: "start-index",
                value: `${index}`
            }
        ];
        if (this.pageType === "search") {
            const param = BloggerQueryParamsBuilder.labelSearch(this.labels);
            if (param)
                params.push(param);
        }
        else
            params.push(BloggerQueryParamsBuilder.maxResult(config.reload ? 1 : config.perPage));
        return Blogger.fetchFeed({
            fetch: {
                params: params
            }
        });
    }
    fetchPageContent(page, queryParams, callback) {
        queryParams = Object.orDefault(queryParams, UriQueryParameters.fromCurrent());
        if (!queryParams)
            return;
        // check values
        this.options.beforeFetchContent();
        // call fetch to use on change page callback
        this.__fetchPageContent(page)
            .then(blog => {
            this.options.afterFetchContent(blog.entries);
            if (callback)
                callback();
        })
            .catch(err => console.log(`An errors occurs in pagination ${this.pageType} - ${page}: ${err}`));
    }
    reloadPageContent(page, type) {
        const config = this.options;
        // build params switch page type
        const searchLabel = `${config.searchLabelPath}/${Object.orDefault(this.labels[0], "")}`;
        const pageParam = new UriQueryItem(this.options.pageParameterName, `${page}`);
        const queryParams = UriQueryParameters.from(this.pageType == "page" ? config.searchPath : searchLabel);
        if (page === 1) {
            if (type === "click" || location.href.includes(pageParam.valueOf()))
                LocationManager.changeUrl(this.pageType === "page" ? "/" : searchLabel);
            return;
        }
        this.__fetchPageContent(page)
            .then(blog => {
            // check if location is defined
            if (typeof location === "undefined")
                return;
            if (!blog.entries.isEmpty()) {
                // format date to valid query parameter
                const published = blog.entries[0].published.replace(/[.][0-9]{3,}-/g, "-");
                queryParams.push({
                    key: "updated-max",
                    value: `${published}`
                });
            }
            queryParams.extend([
                BloggerQueryParamsBuilder.maxResult(config.perPage),
                pageParam
            ]);
            // change location
            const url = queryParams.buildUri();
            if (!location.href.includes(url))
                LocationManager.changeUrl(url);
        })
            .catch(err => console.log(`An errors occurs in pagination ${this.pageType} - ${page}: ${err}`));
    }
}
class BlogPagination {
    static assignDefaultOptions(options) {
        const blogger = {};
        Blogger.assignDefaultOptions(blogger);
        Object.assignIfNotPresent(options, {
            searchLabelPath: "/search/label",
            searchPath: "/search",
            currentPage: "/",
            containerId: "blog-pager",
            postsContainerSelector: ".blog-posts",
            reload: true,
            perPage: 12,
            getPostsContainer() {
                if (!document || !this.postsContainerSelector)
                    return;
                return document.querySelector(this.postsContainerSelector);
            },
            afterFetchContent(posts) {
            },
            beforeFetchContent() {
            },
            blogger: blogger
        });
        PagePagination.assignPagePaginationOptions(options);
    }
    static paginate(options) {
        // validate location
        const isInBrowser = typeof location !== "undefined";
        if (!isInBrowser)
            return;
        const config = Object.orDefault(options, {});
        BlogPagination.assignDefaultOptions(config);
        // check location url
        if ((config.currentPage.isEmpty() || config.currentPage === "/"))
            config.currentPage = location.href;
        // check blog url
        if ((config.blogger.blogUrl.isEmpty() || config.blogger.blogUrl === "/") && isInBrowser)
            config.blogger.blogUrl = location.origin;
        const type = config.currentPage.includes(config.searchLabelPath) ? "search" : "page";
        const parameters = [];
        let labels = [];
        // get search label
        if (type === "search") {
            const queryParams = UriQueryParameters.fromCurrent();
            if (!config.reload && queryParams) {
                const categories = queryParams.getParameter("categories");
                if (categories)
                    labels = categories.key.split(",");
            }
            else if (queryParams) {
                const url = queryParams.getBaseUrl();
                labels = [decodeURIComponent(url.substring(url.lastIndexOf("/") + 1))];
            }
            const param = BloggerQueryParamsBuilder.labelSearch(labels);
            if (param)
                parameters.push(param);
        }
        else
            parameters.push(BloggerQueryParamsBuilder.maxResult(1));
        Blogger.fetchFeed({
            fetch: {
                params: parameters
            },
        }).then(blog => {
            config.total = blog.total;
            const paginator = new BlogPagePaginator(config, type, labels, false);
            // generate pages
            PagePagination.paginate(paginator);
        });
    }
}