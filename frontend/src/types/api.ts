export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export interface ApiValidationErrorResponse extends ApiErrorResponse {
  field: string[]
  message: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse | ApiValidationErrorResponse

export interface PaginationMetadata {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedListData<T> {
  items: T[]
  pagination: PaginationMetadata
}
