/*!!!!!!!!!!!Do not change anything between here (the DRIVERNAME placeholder will be automatically replaced at buildtime)!!!!!!!!!!!*/
// https://github.com/rancher/ui/blob/master/lib/shared/addon/mixins/cluster-driver.js
import ClusterDriver from 'shared/mixins/cluster-driver';
import { satisfies } from 'shared/utils/parse-version';
import { sortableNumericSuffix } from 'shared/utils/util';

// do not remove LAYOUT, it is replaced at build time with a base64 representation of the template of the hbs template
// we do this to avoid converting template to a js file that returns a string and the cors issues that would come along with that
const LAYOUT;
/*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/


/*!!!!!!!!!!!GLOBAL CONST START!!!!!!!!!!!*/
// EMBER API Access - if you need access to any of the Ember API's add them here in the same manner rather then import them via modules, since the dependencies exist in rancher we dont want to expor the modules in the amd def
const computed     = Ember.computed;
const observer     = Ember.observer;
const get          = Ember.get;
const set          = Ember.set;
const alias        = Ember.computed.alias;
const service      = Ember.inject.service;
const all          = Ember.RSVP.all;

/*!!!!!!!!!!!GLOBAL CONST END!!!!!!!!!!!*/

const REGIONS = [
  {
    label: 'us-phoenix-1',
    value: 'us-phoenix-1'
  }, {
    label: 'eu-frankfurt-1',
    value: 'eu-frankfurt-1'
  }, {
    label: 'us-ashburn-1',
    value: 'us-ashburn-1'
  }, {
    label: 'uk-london-1',
    value: 'uk-london-1'
  }];

const VERSIONS = [
  {
    label: 'v1.11.5',
    value: 'v1.11.5'
  },
  {
    label: 'v1.10.11',
    value: 'v1.10.11'
  }
];

const IMAGES = [
  {
    label: 'Oracle-Linux-7.5',
    value: 'Oracle-Linux-7.5'
  },
  {
    label: 'BM.Standard2.52',
    value: 'BM.Standard2.52'
  },
  
];

const SHAPES = [
  {
    label: 'BM.DenseIO2.52',
    value: 'BM.DenseIO2.52'
  },
  {
    label: 'Oracle-Linux-7.4',
    value: 'Oracle-Linux-7.4'
  },
  {
    label: 'VM.DenseIO2.16',
    value: 'VM.DenseIO2.16'
  },
  {
    label: 'VM.DenseIO2.24',
    value: 'VM.DenseIO2.24'
  },
  {
    label: 'VM.DenseIO2.8',
    value: 'VM.DenseIO2.8'
  },
  {
    label: 'VM.Standard2.1',
    value: 'VM.Standard2.1'
  },
  {
    label: 'VM.Standard2.16',
    value: 'VM.Standard2.16'
  },
  {
    label: 'VM.Standard2.2',
    value: 'VM.Standard2.2'
  },
  {
    label: 'VM.Standard2.24',
    value: 'VM.Standard2.24'
  },
  {
    label: 'VM.Standard2.4',
    value: 'VM.Standard2.4'
  },
  {
    label: 'VM.Standard2.8',
    value: 'VM.Standard2.8'
  }
];


/*!!!!!!!!!!!DO NOT CHANGE START!!!!!!!!!!!*/
export default Ember.Component.extend(ClusterDriver, {
  driverName:  '%%DRIVERNAME%%',
  configField: '%%DRIVERNAME%%EngineConfig', // 'googleKubernetesEngineConfig'
  app:         service(),
  router:      service(),
/*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/

  init() {
    /*!!!!!!!!!!!DO NOT CHANGE START!!!!!!!!!!!*/
    // This does on the fly template compiling, if you mess with this :cry:
    const decodedLayout = window.atob(LAYOUT);
    const template      = Ember.HTMLBars.compile(decodedLayout, {
      moduleName: 'shared/components/cluster-driver/driver-%%DRIVERNAME%%/template'
    });
    set(this,'layout', template);

    this._super(...arguments);
    /*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/

    let config      = get(this, 'config');
    let configField = get(this, 'configField');


    if ( !config ) {
      config = this.get('globalStore').createRecord({
        type:                      configField,
        region:                    'us-phoenix-1',
        kubernetesVersion:         'v1.11.5',
        nodepoolImage:             'Oracle-Linux-7.5',
        nodepoolShape:             'VM.Standard2.1',
        noodpoolVersion:           'v1.11.5',
        sshPublicKeyContents:      '',  
        podsCidr:                  '10.244.0.0/16',
        serviceCidr:               '10.96.0.0/16',
      });

      set(this, `cluster.${ configField }`, config);
    }

  },

  config: alias('cluster.%%DRIVERNAME%%EngineConfig'),
  /*!!!!!!!!!!!DO NOT CHANGE END!!!!!!!!!!!*/
  step:                1,
  regionChoices:       REGIONS,
  versionChoices:      VERSIONS,
  imageChoices:        IMAGES,
  shapeChoices:        SHAPES,
  netMode:             'default',
  virtualNetworks:      null,
  compartmentChoice:    null,
  netCompartment:       '',
  vcnChoices:           null,
  vcn:                  '',
  subnetsChoices:       null,
  subnets:              '',
  nodepoolName:         '',

  actions: {
    save() {},
    cancel(){
      // probably should not remove this as its what every other driver uses to get back
      get(this, 'router').transitionTo('global-admin.clusters.index');
    },
    clickNext() {
      this.$('BUTTON[type="submit"]').click();
    },

    authenticate(cb) {
      const store = get(this, 'globalStore')
      const data = {
        fingerPrint:       get(this, 'config.fingerPrint'),
        apiKey:   get(this, 'config.apiKey'),
        tenancyID: get(this, 'config.tenancyID'),
        userID:       get(this, 'config.userID'),
        region:         get(this, 'config.region')
      };
      const okeRequest = {
        virtualNetworks: store.rawRequest({
          url:    '/meta/okeVirtualNetworks',
          method: 'POST',
          data
        })
      }

      return hash(okeRequest).then((resp) => {
        const { virtualNetworks } = resp;

        setProperties(this, {
          step:            2,
          virtualNetworks: (get(virtualNetworks, 'body') || []),
        });

        cb(true);
      }).catch((xhr) => {
        const err = xhr.body.message || xhr.body.code || xhr.body.error;

        setProperties(this, { errors: [err], });

        cb(false, [err]);
      });
    },
  },


  // Add custom validation beyond what can be done from the config API schema
  validate() {
    // Get generic API validation errors
    this._super();
    var errors = get(this, 'errors')||[];
    if ( !get(this, 'cluster.name') ) {
      errors.push('Name is required');
    }


    if ( !get(this, 'config.sshPublicKeyContents') ) {
      errors.push(intl.t('validation.required', { key: intl.t('clusterNew.oracleoke.ssh.label') }));
    }


    // Add more specific errors

    // Check something and add an error entry if it fails:
    // if ( parseInt(get(this, 'config.memorySize'), defaultRadix) < defaultBase ) {
    //   errors.push('Memory Size must be at least 1024 MB');
    // }

    // Set the array of errors for display,
    // and return true if saving should continue.
    if ( get(errors, 'length') ) {
      set(this, 'errors', errors);
      return false;
    } else {
      set(this, 'errors', null);
      return true;
    }
  },

  // Any computed properties or custom logic can go here
  compartmentChoice: function() {
    return this.get('virtualNetworks').map(function(name, value) {
      return {name: name, value: value};
    });
  }.property('virtualNetworks.@each'),

  vcnChoices: computed('netCompartment', function() {
    const netCompartment = get(this, 'netCompartment');
    const virtualNetworks = get(this, 'virtualNetworks');
    vcns = [];

    virtualNetworks.forEach( (compartment) => {
      if( get(compartment, 'name')===netCompartment){
        vcns= get(compartment, 'VCNS')
      }   
    });

    return vcns;
  }),

  subnetsChoices: computed('vcn', function() {
    const netvcn = get(this, 'vcn');
    const vcnChoices = get(this, 'vcnChoices');
    subnets = [];

    vcnChoices.forEach( (vcn) => {
      if( get(vcn, 'name')===netvcn){
        subnets= get(vcn, 'VCNS')
      }   
    });

    return subnets;
  }),

  

  isEditable: computed('mode', function() {
    return ( get(this, 'mode') === 'edit' || get(this, 'mode') === 'new' ) ? true : false;
  }),

  saveDisabled: computed('config.subscriptionId', 'config.tenantId', 'config.clientId', 'config.clientSecret', 'config.location', function() {
    return get(this, 'config.tenantId') && get(this, 'config.clientId') && get(this, 'config.clientSecret') && get(this, 'config.subscriptionId') && get(this, 'config.location') ? false : true;
  }),
});
