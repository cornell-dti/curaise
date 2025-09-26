declare module "quoted-printable" {
  export function decode(input: string, binary?: boolean): string;
  export function encode(input: string, binary?: boolean): string;
}
