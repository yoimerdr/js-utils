export interface PagePaginatorCommonOptions {
  showPages: number,
  alwaysShow: number,
  showEllipsis: boolean
}

export interface PagePaginatorResponsive {
  [key: number | string]: PagePaginatorCommonOptions
}

export interface PagePaginatorResponsiveValue {
  key: number,
  value: PagePaginatorCommonOptions
}

export interface PagePaginatorOptions {
  actionPage: string,
  alwaysShow: number,
  totalPages: number,
  containerId: string,
  containerPagesId: string,
  ellipsisPage: string,
  ellipsisText: string,
  next: string,
  pageActive: string,
  pageDisable: string,
  pageParameterName: string,
  pageText: string,
  perPage: number,
  previous: string,
  reload: boolean,
  responsive: PagePaginatorResponsive,
  showEllipsis: boolean,
  showPages: number,
  total: number,
  onPageChange(page: number, type: string)
}
