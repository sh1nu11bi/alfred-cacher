const alfy = require('alfy');
const Fuse = require('fuse.js');

const CACHER_API_HOST = process.env['CACHER_API_HOST'] || 'https://api.cacher.io';
const API_KEY = process.env['CACHER_API_KEY'];
const API_TOKEN = process.env['CACHER_API_TOKEN'];

const CACHE_MAX_AGE = 1000 * 5;

const FETCH_OPTIONS = {
    headers: {
        'X-Api-Key': API_KEY,
        'X-Api-Token': API_TOKEN
    },
    maxAge: CACHE_MAX_AGE
};

if (!API_KEY || !API_TOKEN) {
    alfy.error('Set "CACHER_API_KEY" and "CACHER_API_TOKEN" workflow variables.');
    return;
}

alfy.fetch(
    `${CACHER_API_HOST}/integrations/show_all`,
    FETCH_OPTIONS
).then(data => {
    let teamSnippets = data.teams.reduce((allSnippets, team) => {
        return allSnippets.concat(team.library.snippets);
    }, []);

    let allSnippets = data.personalLibrary.snippets.concat(teamSnippets);

    let options = {
        threshold: 0.6,
        location: 0,
        distance: 100,
        maxPatternLength: 30,
        minMatchCharLength: 1,
        shouldSort: true,
        keys: [
            {
                name: 'title',
                weight: 0.9
            },
            {
                name: 'description',
                weight: 0.1
            }
        ]
    };

    let fuse = new Fuse(allSnippets, options);
    const items = fuse.search(alfy.input).map(x => {
        let firstFile = x.files[0];
        let firstFileContent = firstFile.content;

        return {
            title: x.title,
            subtitle: firstFileContent,
            text: {
                copy: firstFileContent,
                largetype: x.description
            },
            arg: firstFileContent
        };
    });

    alfy.output(items);
});
