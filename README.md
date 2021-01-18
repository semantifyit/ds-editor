# Domain Specification Editor

## Installation

Bundle your source files with browserify:

``` bash
$ browserify src/js/DSEditor.js -s DSEditor -o bundle.js
```

Add Material Design for Bootrap and the bundled file to your website:

``` html
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" rel="stylesheet"/>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
<!-- MDB -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.0.0/mdb.min.css" rel="stylesheet"/>

<!-- MDB -->
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/3.0.0/mdb.min.js"></script>
<script src="bundle.js"></script>
```

## Usage

To create a Domain Specification Editor inside a HTML DOM Element do the following:

``` html
<div id="ds-editor"></div>
<script>
    (async function() {
        const div = document.getElementById('ds-editor');
        const dsEditor = await DSEditor.build(div);
        dsEditor.render();
    }());
</script>
```
