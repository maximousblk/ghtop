# ghtop

See what's happening on GitHub in real time. Deno port of [`nat/ghtop`](https://github.com/nat/ghtop)

![preview](https://user-images.githubusercontent.com/28438021/101397567-dc0cce80-38f2-11eb-8305-5a5803c4dd29.png)

<sub> PS: this will drain your API quota <i>fast</i> </sub>

### Usage

**Run directly:**

```sh
deno run -A https://deno.land/x/ghtop/ghtop.ts
```

**Install**

```sh
deno install -A https://deno.land/x/ghtop/ghtop.ts

# and then

ghtop
```

### Authorization

You can set an environment variable named `GITHUB_TOKEN` to automatically authorize. If the `GITHUB_TOKEN` environment variable is not present, the CLI will prompt you to enter a verification on [`github.com/login/device`](https://github.com/login/device)

### Credit

This project was originally made by [Nat Friedman](https://github.com/nat) in Python.

### License

This project is distributed under the MIT License
