export function URLQuery(url){
    url = url ? Object.assign(document.createElement('a'), { href: url }) : location
    const out = Object.create(null)
    const query = url.search.substring(1)
    const regex = /[?&]?([^=]+)=([^&]*)/g
    for(let tokens; tokens = regex.exec(query); out[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]));
    return out
}