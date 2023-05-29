



<template>
    <div>

		<div class="card">
			<div class="card-header">
				<div>KuKaKo</div>

				<h4>About</h4>
			</div>
			<div class="card-body">
				<div class="alert alert-success">MessyDesk is a visual, open source tool for <br><b>digital humanities</b>.<br>
				<i class=" bi bi-arrow-left" style="font-size: 1.2rem;margin-left:10px"> checkout the graph!
                </i>
				</div>



<div class="accordion" id="accordionExample">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingOne">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
        How KuKaKo works?
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
      <div class="accordion-body">
		  	<p>"Things" (or nodes) can be persons, www-sites, it-systems, dogs, art , mountain bikes or whatever. These <b>things can be connected with named relationship</b>. Together nodes and relationships forms a database (a graph) that can be queried, filtered and visualised many ways.</p>
			<p>In more technical terms, KuKaKo uses directed graphs. "Directed" here means that every link between nodes has direction: link starts from node A and ends with node B.
				</p>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingTwo">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
        How to define what kind of "things" can be saved?
      </button>
    </h2>
    <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
      <div class="accordion-body">
		  <p>
			  There is a special graph in KuKaKo called <router-link :to="'schema'">Schema</router-link>. This graph defines what type of nodes there can be (like "Person", "Team", etc,) and how they can be linked.
			</p>
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingThree">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
        Tech stuff
      </button>
    </h2>
    <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
      <div class="accordion-body">
				<p>KuKaKo uses <a href="https://arcadedb.com/" target="_blank">ArcadeDB</a> as graph database and <a href="https://js.cytoscape.org/" target="_blank">cytoscape.js</a> for rendering graphs. User interface is Vue 3 and backend runs on NodeJS.
					</p>
				<p>
					KuKaKo is develop by <a href="https://osc.jyu.fi/en/" target="_blank">Open Science Centre of University of Jyväskylä</a>.
				</p>
      </div>
    </div>
  </div>
</div>


			</div>
		</div>

    </div>
</template>
