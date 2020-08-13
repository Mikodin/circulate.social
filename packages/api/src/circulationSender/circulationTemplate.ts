export default `
<div>
    <h2>Hi {{usersFirstName}} here's your Circulation</h2>

    {{#with circulation}}
        {{#each circleDetails}}
            <h3 style="margin: 0; padding: 0; margin-bottom: 5px;">
                {{name}}
            </h3>
            <div style="margin-left: 5px;">
                {{#each contentDetails}}
                    <div>
                        <p style="margin: 0; margin-bottom: 5px">
                            {{title}} | {{createdBy}}
                        </p>
                        <span style="margin-left: 5px;">{{description}}</span>
                    </div>
                {{/each}}
            </div>
            <hr />
        {{/each}}
    {{/with}}
</div>`;
