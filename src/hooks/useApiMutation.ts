import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import axios, { type AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

interface ApiErrorResponse {
  data: unknown;
  disclaimer: unknown;
  status: string;
  message?: string;
}

interface ApiMutationProps<TResponse, TPayload> {
  url: string;
  method: "post" | "put" | "patch" | "delete";
  axiosConfig?: AxiosRequestConfig;
  options?: UseMutationOptions<
    TResponse,
    AxiosError<ApiErrorResponse>,
    TPayload
  >;
}

function useApiMutation<TResponse = unknown, Tpayload = void>({
  url,
  method,
  axiosConfig,
  options
}: ApiMutationProps<TResponse, Tpayload>) {
  const mutation = useMutation<
    TResponse,
    AxiosError<ApiErrorResponse>,
    Tpayload
  >({
    mutationFn: async (data: Tpayload) => {
      const response = await axios.request({
        url,
        method,
        data,
        ...axiosConfig
      });
      return response.data;
    },
    ...options,

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong, please try again"
      );
    }
  });
  return mutation;
}

export default useApiMutation;
