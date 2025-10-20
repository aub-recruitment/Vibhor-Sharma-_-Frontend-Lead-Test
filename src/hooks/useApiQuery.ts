import {
  type QueryKey,
  type UseQueryOptions,
  useQuery
} from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";
import { toast } from "sonner";
import { useEffect } from "react";

export interface ApiErrorResponse {
  message?: string;
}

type ApiResponse<T> = {
  data: T;
  headers: Record<string, string>;
};

type QueryReturnType<
  T,
  IncludeHeaders extends boolean
> = IncludeHeaders extends true ? ApiResponse<T> : T;

export interface UseApiQueryProps<T, IncludeHeaders extends boolean = false> {
  key: QueryKey;
  url: string;
  enabled?: boolean;
  includeHeaders?: IncludeHeaders;
  options?: Partial<
    UseQueryOptions<
      QueryReturnType<T, IncludeHeaders>,
      AxiosError<ApiErrorResponse>,
      QueryReturnType<T, IncludeHeaders>,
      QueryKey
    >
  >;
  axiosConfig?: Parameters<typeof axios.get>[1];
  onError?: (error: AxiosError<ApiErrorResponse>) => void;
}

export function useApiQuery<T, IncludeHeaders extends boolean = false>({
  key,
  url,
  options,
  enabled,
  includeHeaders,
  axiosConfig,
  onError
}: UseApiQueryProps<T, IncludeHeaders>) {
  const result = useQuery<
    QueryReturnType<T, IncludeHeaders>,
    AxiosError<ApiErrorResponse>
  >({
    ...options,
    queryKey: key,
    queryFn: async () => {
      const res = await axios.get<T>(url, {
        ...axiosConfig
      });
      return (
        includeHeaders
          ? {
              data: res.data,
              headers: res.headers as Record<string, string>
            }
          : res.data
      ) as QueryReturnType<T, IncludeHeaders>;
    },
    enabled
  });

  useEffect(() => {
    if (result.isError) {
      toast.error(
        result.error.response?.data?.message ||
          "An unexpected error occurred. Please try again."
      );
      onError?.(result.error);
    }
  }, [result.isError, result.error, onError]);

  return {
    ...result
  };
}
