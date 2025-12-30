(function(wp){
  var registerBlockType = wp.blocks.registerBlockType;
  var el = wp.element.createElement;
  var InnerBlocks = (wp.blockEditor && wp.blockEditor.InnerBlocks) || (wp.editor && wp.editor.InnerBlocks);
  var InnerBlocksContent = (wp.blockEditor && wp.blockEditor.InnerBlocks && wp.blockEditor.InnerBlocks.Content) || (wp.editor && wp.editor.InnerBlocks && wp.editor.InnerBlocks.Content);

  registerBlockType('powder-child/slider', {
    title: 'Slider',
    category: 'layout',
    icon: 'images-alt2',
    supports: { html: false },
    edit: function(props){
      return el('div', {className: 'powder-slider-editor'},
        el('div', {className: 'powder-slider-editor__placeholder'},
          el('p', null, 'Slider — add blocks inside each slide.'),
          el(InnerBlocks, {allowedBlocks: undefined, orientation: 'horizontal'})
        )
      );
    },
    save: function(){
      return el('div', {className: 'powder-slider'}, el(InnerBlocksContent));
    }
  });
})(window.wp);
