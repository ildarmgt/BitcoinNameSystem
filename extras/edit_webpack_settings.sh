# not used


# in case I need to change webpack settings. can be made part of npm shortcuts

# file='./node_modules/react-scripts/config/webpack.config.js'

# edit module config via bash script
# https://unix.stackexchange.com/questions/270953/whats-the-best-way-to-edit-a-file-with-a-bash-script/270954

# react native settings necessary?
# https://gist.github.com/coreyphillips/9719d7e4b1f6042b993f548d2083cee8

# terser or terser-webpack-plugin
# terser ... -m reserved=['$','require','exports']
# -c --mangle reserved=['BigInteger','ECPair','Point']

# there's minifyJS on line 598 for HTMLWebpackPlugin
# and there's terser-webpack-plugin settings for mangle on  line 241

# uglify-js is used by html-minifier

# node_modules/react-scripts/config/webpackDevServer.config.js has dev server settings