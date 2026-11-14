package signin

import (
	"html/template"
	"net/http"
)

type enterCode struct {
	Typed   string
	Unknown bool
}

type approve struct {
	Code       string
	ClientName string
	Members    []choice
	NoMember   bool
}

type done struct {
	ClientName string
	Member     string
	Refused    bool
}

const layout = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in to Halide Supply</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; margin: 0; background: #f4f2ee; color: #1d1b18; }
  main { max-width: 26rem; margin: 3rem auto; padding: 2rem; background: #fff; border-radius: 12px; }
  h1 { font-size: 1.35rem; margin: 0 0 1rem; }
  .code { font: 600 1.6rem/1 ui-monospace, monospace; letter-spacing: 0.12em; padding: 0.75rem 1rem; background: #f4f2ee; border-radius: 8px; display: inline-block; }
  label.member { display: block; padding: 0.6rem 0.75rem; border: 1px solid #d8d3ca; border-radius: 8px; margin: 0.5rem 0; }
  input[type=text] { font: inherit; font-family: ui-monospace, monospace; padding: 0.5rem; width: 12rem; text-transform: uppercase; }
  .actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  button { font: inherit; padding: 0.55rem 1.2rem; border-radius: 8px; border: 1px solid #1d1b18; background: #fff; cursor: pointer; }
  button.primary { background: #1d1b18; color: #fff; }
  .warn { color: #8a2c0d; }
</style>
</head>
<body><main>
{{template "body" .}}
</main></body>
</html>`

var pages = map[string]*template.Template{
	"enter": page(`
<h1>Sign in to Halide Supply</h1>
{{if .Unknown}}<p class="warn">That code isn't one Halide Supply is waiting for. It may have expired: start the sign-in again where you were shown it.</p>{{end}}
<form method="get">
  <p><label for="code">Enter the code you were shown.</label></p>
  <p><input type="text" id="code" name="code" value="{{.Typed}}" autocomplete="off" autofocus></p>
  <div class="actions"><button class="primary" type="submit">Continue</button></div>
</form>`),
	"approve": page(`
<h1>Sign in to Halide Supply</h1>
<p>Check that this code matches the one you were shown:</p>
<p class="code">{{.Code}}</p>
<form method="post">
  <input type="hidden" name="code" value="{{.Code}}">
  <p>{{if eq (len .Members) 1}}Your account:{{else}}Choose your account:{{end}}</p>
  {{range $i, $m := .Members}}<label class="member"><input type="radio" name="member" value="{{$m.Subject}}"{{if or $m.Fixed (eq $i 0)}} checked{{end}}> {{$m.Account}}</label>
  {{end}}
  {{if .NoMember}}<p class="warn">Choose an account to sign in with.</p>{{end}}
  <p>Signing in lets {{.ClientName}} see Halide Supply's stock and your member prices, and open and sort cameras for you.</p>
  <div class="actions">
    <button class="primary" type="submit" name="decision" value="approve">Approve</button>
    <button type="submit" name="decision" value="refuse">Refuse</button>
  </div>
</form>`),
	"done": page(`
{{if .Refused}}<h1>Sign-in refused</h1>
<p>{{.ClientName}} can't see your Halide Supply account. You can close this window.</p>
{{else}}<h1>You're signed in</h1>
<p>You're signed in to Halide Supply as {{.Member}}. You can close this window and go back to {{.ClientName}}.</p>
{{end}}`),
}

func page(body string) *template.Template {
	t := template.Must(template.New("page").Parse(layout))
	return template.Must(t.New("body").Parse(body))
}

func render(w http.ResponseWriter, status int, data any) {
	name := "enter"
	switch data.(type) {
	case approve:
		name = "approve"
	case done:
		name = "done"
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = pages[name].ExecuteTemplate(w, "page", data)
}
