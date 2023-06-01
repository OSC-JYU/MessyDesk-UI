



<template>
    <div>

		<div class="card">
			<div class="card-header">
				<div>MessyDesk</div>

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
        How MessyDesk works?
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
      <div class="accordion-body">
		  	<p>MessyDesk is a tool with graphical user interface for collecting, organising and processing all kind of GLAM staff. MessyDesk is a graph platform where you can build network of information based on your needs. Create a network of data where every item, media file and relationship is important and documentable.</p>

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
				<p>MessyDesk uses <a href="https://arcadedb.com/" target="_blank">ArcadeDB</a> as graph database and <a href="https://js.cytoscape.org/" target="_blank">cytoscape.js</a> for rendering graphs. User interface is Vue 3 and backend runs on NodeJS. The task queue is handled with <a href="https://kafka.apache.org" target="_blank">Kafka</a>.
					</p>
				<p>
					MessyDesk is develop by <a href="https://osc.jyu.fi/en/" target="_blank">Open Science Centre of University of Jyväskylä</a>.
				</p>
      </div>
    </div>
  </div>
</div>


			</div>
		</div>

    </div>
</template>
