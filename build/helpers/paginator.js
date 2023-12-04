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
